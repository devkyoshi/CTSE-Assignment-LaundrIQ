package com.ctse.customer.service;

import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.customer.dto.EarnPointsRequest;
import com.ctse.customer.dto.LoyaltyAccountDto;
import com.ctse.customer.dto.LoyaltyTransactionDto;
import com.ctse.customer.dto.RedeemPointsRequest;
import com.ctse.customer.model.LoyaltyAccount;
import com.ctse.customer.model.LoyaltyTier;
import com.ctse.customer.model.LoyaltyTransaction;
import com.ctse.customer.model.LoyaltyTransaction.TransactionType;
import com.ctse.customer.repositary.LoyaltyAccountRepository;
import com.ctse.customer.repositary.LoyaltyTransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class LoyaltyService {

    // Points earned per order value unit — tune this to your business logic
    private static final int POINTS_PER_ORDER_UNIT = 10;

    private final LoyaltyAccountRepository accountRepository;
    private final LoyaltyTransactionRepository transactionRepository;

    // ──────────────────────────────────────────────────────────────
    //  Account bootstrap
    // ──────────────────────────────────────────────────────────────

    /**
     * Creates a fresh loyalty account for a new customer.
     * Call this from a CustomerCreated event listener or registration flow.
     */
    @Transactional
    public LoyaltyAccountDto createAccount(String customerId) {
        if (accountRepository.existsByCustomerId(customerId)) {
            log.warn("Loyalty account already exists for customer: {}", customerId);
            return getAccount(customerId);
        }

        LoyaltyAccount account = LoyaltyAccount.builder()
                .customerId(customerId)
                .totalPoints(0)
                .lifetimePoints(0)
                .tier(LoyaltyTier.BRONZE)
                .build();

        LoyaltyAccount saved = accountRepository.save(account);
        log.info("Created loyalty account for customer: {}", customerId);
        return toDto(saved);
    }

    // ──────────────────────────────────────────────────────────────
    //  Read
    // ──────────────────────────────────────────────────────────────

    public LoyaltyAccountDto getAccount(String customerId) {
        LoyaltyAccount account = findAccount(customerId);
        return toDto(account);
    }

    public Page<LoyaltyTransactionDto> getTransactionHistory(String customerId, Pageable pageable) {
        log.info("Fetching loyalty transaction history for customer: {}", customerId);
        return transactionRepository
                .findByCustomerIdOrderByCreatedAtDesc(customerId, pageable)
                .map(this::toTransactionDto);
    }

    // ──────────────────────────────────────────────────────────────
    //  Earn points (called after an order is completed)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public LoyaltyAccountDto earnPoints(EarnPointsRequest request) {
        log.info("Earning {} points for customer: {}", request.getPoints(), request.getCustomerId());

        LoyaltyAccount account = findAccount(request.getCustomerId());

        // Apply tier multiplier
        int basePoints = request.getPoints();
        int multipliedPoints = (int) Math.floor(basePoints * account.getTier().getMultiplier());

        account.setTotalPoints(account.getTotalPoints() + multipliedPoints);
        account.setLifetimePoints(account.getLifetimePoints() + multipliedPoints);

        // Recalculate tier based on lifetime points
        LoyaltyTier newTier = LoyaltyTier.fromLifetimePoints(account.getLifetimePoints());
        if (newTier != account.getTier()) {
            log.info("Customer {} upgraded from {} to {}", request.getCustomerId(), account.getTier(), newTier);
            account.setTier(newTier);
        }

        accountRepository.save(account);

        recordTransaction(account.getCustomerId(), multipliedPoints,
                TransactionType.EARNED, request.getDescription(),
                request.getReferenceId(), account.getTotalPoints());

        return toDto(account);
    }

    // ──────────────────────────────────────────────────────────────
    //  Redeem points (customer applies points to an order)
    // ──────────────────────────────────────────────────────────────

    @Transactional
    public LoyaltyAccountDto redeemPoints(RedeemPointsRequest request) {
        log.info("Redeeming {} points for customer: {}", request.getPoints(), request.getCustomerId());

        LoyaltyAccount account = findAccount(request.getCustomerId());

        if (account.getTotalPoints() < request.getPoints()) {
            throw new IllegalArgumentException(
                    String.format("Insufficient points. Available: %d, Requested: %d",
                            account.getTotalPoints(), request.getPoints()));
        }

        account.setTotalPoints(account.getTotalPoints() - request.getPoints());
        accountRepository.save(account);

        recordTransaction(account.getCustomerId(), -request.getPoints(),
                TransactionType.REDEEMED,
                "Points redeemed for order " + request.getReferenceId(),
                request.getReferenceId(), account.getTotalPoints());

        return toDto(account);
    }

    // ──────────────────────────────────────────────────────────────
    //  Helper: calculate points from order value
    // ──────────────────────────────────────────────────────────────

    public int calculatePointsForOrder(double orderTotal) {
        return (int) Math.floor(orderTotal) * POINTS_PER_ORDER_UNIT;
    }

    // ──────────────────────────────────────────────────────────────
    //  Private helpers
    // ──────────────────────────────────────────────────────────────

    private LoyaltyAccount findAccount(String customerId) {
        return accountRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("LoyaltyAccount", "customerId", customerId));
    }

    private void recordTransaction(String customerId, int points, TransactionType type,
                                   String description, String referenceId, int balanceAfter) {
        LoyaltyTransaction tx = LoyaltyTransaction.builder()
                .customerId(customerId)
                .points(points)
                .type(type)
                .description(description)
                .referenceId(referenceId)
                .balanceAfter(balanceAfter)
                .build();
        transactionRepository.save(tx);
    }

    private LoyaltyAccountDto toDto(LoyaltyAccount account) {
        return LoyaltyAccountDto.builder()
                .id(account.getId())
                .customerId(account.getCustomerId())
                .totalPoints(account.getTotalPoints())
                .lifetimePoints(account.getLifetimePoints())
                .tier(account.getTier())
                .tierMultiplier(account.getTier().getMultiplier())
                .pointsToNextTier(account.getTier().pointsToNextTier(account.getLifetimePoints()))
                .updatedAt(account.getUpdatedAt())
                .build();
    }

    private LoyaltyTransactionDto toTransactionDto(LoyaltyTransaction tx) {
        return LoyaltyTransactionDto.builder()
                .id(tx.getId())
                .points(tx.getPoints())
                .type(tx.getType())
                .description(tx.getDescription())
                .referenceId(tx.getReferenceId())
                .balanceAfter(tx.getBalanceAfter())
                .createdAt(tx.getCreatedAt())
                .build();
    }
}