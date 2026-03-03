package com.ctse.pricingservice.repository;

import com.ctse.pricingservice.model.PriceCatalogue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceCatalogueRepository extends JpaRepository<PriceCatalogue, Long> {

    Optional<PriceCatalogue> findByServiceTypeAndItemType(String serviceType, String itemType);

    List<PriceCatalogue> findByServiceType(String serviceType);

    boolean existsByServiceTypeAndItemType(String serviceType, String itemType);
}
