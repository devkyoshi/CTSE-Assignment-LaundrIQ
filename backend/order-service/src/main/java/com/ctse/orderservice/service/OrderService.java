package com.ctse.orderservice.service;

import com.ctse.common.exception.ResourceNotFoundException;
import com.ctse.orderservice.dto.CreateOrderRequest;
import com.ctse.orderservice.dto.OrderResponse;
import com.ctse.orderservice.dto.UpdateOrderStatusRequest;
import com.ctse.orderservice.mapper.OrderMapper;
import com.ctse.orderservice.model.Order;
import com.ctse.orderservice.model.TimeSlot;
import com.ctse.orderservice.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ctse.orderservice.grpc.client.CustomerGrpcClient;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderMapper orderMapper;
    private final CustomerGrpcClient customerGrpcClient;

    public List<OrderResponse> findAll() {
        log.info("Fetching all orders");
        return orderRepository.findAll().stream()
                .map(orderMapper::toDto)
                .collect(Collectors.toList());
    }

    public OrderResponse findById(Long id) {
        log.info("Fetching order with id: {}", id);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        return orderMapper.toDto(order);
    }

    public List<OrderResponse> findByCustomerId(String customerId) {
        log.info("Fetching orders for customer: {}", customerId);
        return orderRepository.findByCustomerId(customerId).stream()
                .map(orderMapper::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        log.info("Creating order for customer: {}", request.getCustomerId());
        
        double discountPercentage = customerGrpcClient.getCustomerDiscount(request.getCustomerId());
        if (discountPercentage > 0 && request.getTotalPrice() != null) {
            double discountedPrice = request.getTotalPrice() * (1 - discountPercentage);
            log.info("Applying loyalty discount. Original price: {}, New price: {}", 
                     request.getTotalPrice(), discountedPrice);
            request.setTotalPrice(discountedPrice);
        }

        Order order = orderMapper.toEntity(request);
        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully with id: {}", savedOrder.getId());
        return orderMapper.toDto(savedOrder);
    }

    @Transactional
    public OrderResponse updateStatus(Long id, UpdateOrderStatusRequest request) {
        log.info("Updating status for order id {}: {}", id, request.getStatus());
        Order existing = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        existing.setStatus(request.getStatus());
        Order updated = orderRepository.save(existing);
        log.info("Order status updated successfully");
        return orderMapper.toDto(updated);
    }

    @Transactional
    public OrderResponse updateOrder(Long id, CreateOrderRequest request) {
        log.info("Updating order details for id: {}", id);
        Order existing = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));

        existing.setCustomerId(request.getCustomerId());
        existing.setServiceType(request.getServiceType());
        existing.setWeight(request.getWeight());
        existing.setIsExpress(request.getIsExpress());
        existing.setIsDryClean(request.getIsDryClean());
        existing.setTotalPrice(request.getTotalPrice());
        
        if (request.getPickupSlot() != null) {
            if (existing.getPickupSlot() == null) {
                existing.setPickupSlot(new TimeSlot());
            }
            existing.getPickupSlot().setDate(request.getPickupSlot().getDate());
            existing.getPickupSlot().setTime(request.getPickupSlot().getTime());
        }
        
        if (request.getDeliverySlot() != null) {
            if (existing.getDeliverySlot() == null) {
                existing.setDeliverySlot(new TimeSlot());
            }
            existing.getDeliverySlot().setDate(request.getDeliverySlot().getDate());
            existing.getDeliverySlot().setTime(request.getDeliverySlot().getTime());
        }

        existing.getItems().clear();
        if (request.getItems() != null) {
            Order mappedOrder = orderMapper.toEntity(request);
            mappedOrder.getItems().forEach(item -> item.setOrder(existing));
            existing.getItems().addAll(mappedOrder.getItems());
        }

        Order updated = orderRepository.save(existing);
        log.info("Order details updated successfully");
        return orderMapper.toDto(updated);
    }

    @Transactional
    public void deleteById(Long id) {
        log.info("Deleting order with id: {}", id);
        if (!orderRepository.existsById(id)) {
            log.warn("Order with id: {} not found for deletion", id);
            throw new ResourceNotFoundException("Order", id);
        }
        orderRepository.deleteById(id);
        log.info("Order deleted successfully");
    }
}
