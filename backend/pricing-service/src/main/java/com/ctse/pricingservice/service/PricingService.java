package com.ctse.pricingservice.service;

import com.ctse.common.exception.ConflictException;
import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.pricingservice.dto.PriceCatalogueRequest;
import com.ctse.pricingservice.model.PriceCatalogue;
import com.ctse.pricingservice.repository.PriceCatalogueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PricingService {

    private final PriceCatalogueRepository repository;

    // ── Read ──────────────────────────────────────────────────────────────────

    public List<PriceCatalogue> findAll() {
        return repository.findAll();
    }

    public List<PriceCatalogue> findByServiceType(String serviceType) {
        return repository.findByServiceType(serviceType.toUpperCase());
    }

    public PriceCatalogue findById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("PriceCatalogue", id));
    }

    public PriceCatalogue findByServiceAndItemType(String serviceType, String itemType) {
        return repository.findByServiceTypeAndItemType(serviceType.toUpperCase(), itemType.toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException(
                        String.format("No price found for service '%s' and item '%s'", serviceType, itemType)));
    }

    public double calculatePrice(String serviceType, String itemType, int quantity) {
        PriceCatalogue entry = findByServiceAndItemType(serviceType, itemType);
        return entry.getUnitPrice() * quantity;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    @Transactional
    public PriceCatalogue create(PriceCatalogueRequest request) {
        String svc  = request.getServiceType().toUpperCase();
        String item = request.getItemType().toUpperCase();

        if (repository.existsByServiceTypeAndItemType(svc, item)) {
            throw new ConflictException("PriceCatalogue", "service+item", svc + "+" + item);
        }

        PriceCatalogue entry = PriceCatalogue.builder()
                .serviceType(svc)
                .itemType(item)
                .unitPrice(request.getUnitPrice())
                .currency(request.getCurrency() != null ? request.getCurrency().toUpperCase() : "USD")
                .build();

        PriceCatalogue saved = repository.save(entry);
        log.info("Created price entry id={} for {}/{}", saved.getId(), svc, item);
        return saved;
    }

    @Transactional
    public PriceCatalogue update(Long id, PriceCatalogueRequest request) {
        PriceCatalogue existing = findById(id);
        existing.setUnitPrice(request.getUnitPrice());
        if (request.getCurrency() != null) {
            existing.setCurrency(request.getCurrency().toUpperCase());
        }
        return repository.save(existing);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("PriceCatalogue", id);
        }
        repository.deleteById(id);
        log.info("Deleted price entry id={}", id);
    }
}
