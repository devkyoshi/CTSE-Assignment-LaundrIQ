package com.ctse.orderservice.config;

import com.ctse.orderservice.model.PricingRule;
import com.ctse.orderservice.repository.PricingRuleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final PricingRuleRepository pricingRuleRepository;

    @Override
    public void run(String... args) throws Exception {
        if (pricingRuleRepository.count() == 0) {
            log.info("Seeding default pricing rules");
            pricingRuleRepository.saveAll(List.of(
                    new PricingRule("STANDARD_PER_KILO", 100.00),
                    new PricingRule("EXPRESS_MULTIPLIER", 1.50),
                    new PricingRule("DRY_CLEAN_FEE", 450.00),
                    new PricingRule("PREM_CAT_COAT", 2000.00),
                    new PricingRule("PREM_CAT_DRESS", 1500.00),
                    new PricingRule("PREM_CAT_SUIT", 1000.00),
                    new PricingRule("PREM_CAT_WEDDING", 1500.00)
            ));
        }
    }
}
