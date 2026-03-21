package com.ctse.orderservice.mapper;

import com.ctse.orderservice.dto.CreateOrderRequest;
import com.ctse.orderservice.dto.OrderItemDto;
import com.ctse.orderservice.dto.OrderResponse;
import com.ctse.orderservice.dto.TimeSlotDto;
import com.ctse.orderservice.model.Order;
import com.ctse.orderservice.model.OrderItem;
import com.ctse.orderservice.model.TimeSlot;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class OrderMapper {

    public Order toEntity(CreateOrderRequest dto) {
        Order order = new Order();
        order.setCustomerId(dto.getCustomerId());
        order.setServiceType(dto.getServiceType());
        order.setWeight(dto.getWeight());
        order.setIsExpress(dto.getIsExpress());
        order.setIsDryClean(dto.getIsDryClean());
        order.setTotalPrice(dto.getTotalPrice());

        if (dto.getPickupSlot() != null) {
            order.setPickupSlot(new TimeSlot(dto.getPickupSlot().getDate(), dto.getPickupSlot().getTime()));
        }
        if (dto.getDeliverySlot() != null) {
            order.setDeliverySlot(new TimeSlot(dto.getDeliverySlot().getDate(), dto.getDeliverySlot().getTime()));
        }

        if (dto.getItems() != null) {
            order.setItems(dto.getItems().stream().map(itemDto -> {
                OrderItem item = new OrderItem();
                item.setName(itemDto.getName());
                item.setQuantity(itemDto.getQuantity());
                item.setUnitPrice(itemDto.getUnitPrice());
                return item;
            }).collect(Collectors.toList()));
        }
        return order;
    }

    public OrderResponse toDto(Order entity) {
        OrderResponse response = new OrderResponse();
        response.setId(entity.getId());
        response.setCustomerId(entity.getCustomerId());
        response.setServiceType(entity.getServiceType());
        response.setWeight(entity.getWeight());
        response.setIsExpress(entity.getIsExpress());
        response.setIsDryClean(entity.getIsDryClean());
        response.setTotalPrice(entity.getTotalPrice());
        response.setStatus(entity.getStatus());
        response.setCreatedAt(entity.getCreatedAt());

        if (entity.getPickupSlot() != null) {
            TimeSlotDto pickup = new TimeSlotDto();
            pickup.setDate(entity.getPickupSlot().getDate());
            pickup.setTime(entity.getPickupSlot().getTime());
            response.setPickupSlot(pickup);
        }

        if (entity.getDeliverySlot() != null) {
            TimeSlotDto delivery = new TimeSlotDto();
            delivery.setDate(entity.getDeliverySlot().getDate());
            delivery.setTime(entity.getDeliverySlot().getTime());
            response.setDeliverySlot(delivery);
        }

        if (entity.getItems() != null) {
            response.setItems(entity.getItems().stream().map(item -> {
                OrderItemDto dto = new OrderItemDto();
                dto.setName(item.getName());
                dto.setQuantity(item.getQuantity());
                dto.setUnitPrice(item.getUnitPrice());
                return dto;
            }).collect(Collectors.toList()));
        }
        return response;
    }
}
