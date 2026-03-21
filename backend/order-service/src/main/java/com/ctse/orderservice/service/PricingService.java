package com.ctse.orderservice.service;

import com.ctse.orderservice.model.PricingRule;
import com.ctse.orderservice.repository.PricingRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PricingService {
    
    private final PricingRuleRepository pricingRuleRepository;

    public Map<String, Double> getAllPricingRules() {
        return pricingRuleRepository.findAll().stream()
                .collect(Collectors.toMap(PricingRule::getKey, PricingRule::getValue));
    }

    @Transactional
    public Map<String, Double> updatePricingRules(Map<String, Double> newRules) {
        log.info("Updating pricing rules: {}", newRules.keySet());
        
        List<PricingRule> existingRules = pricingRuleRepository.findAll();
        Map<String, PricingRule> existingRuleMap = existingRules.stream()
                .collect(Collectors.toMap(PricingRule::getKey, rule -> rule));

        for (Map.Entry<String, Double> entry : newRules.entrySet()) {
            if (entry.getValue() != null && entry.getValue() >= 0) {
                PricingRule rule = existingRuleMap.getOrDefault(entry.getKey(), new PricingRule(entry.getKey(), 0.0));
                rule.setValue(entry.getValue());
                pricingRuleRepository.save(rule);
            }
        }
        
        return getAllPricingRules();
    }
}
