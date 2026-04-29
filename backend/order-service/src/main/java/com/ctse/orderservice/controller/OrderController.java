package com.ctse.orderservice.controller;

import com.ctse.common.response.ApiResponse;
import com.ctse.orderservice.dto.CreateOrderRequest;
import com.ctse.orderservice.dto.OrderResponse;
import com.ctse.orderservice.dto.UpdateOrderStatusRequest;
import com.ctse.orderservice.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        log.info("Received request to get all orders");
        List<OrderResponse> orders = orderService.findAll();
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", orders));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        log.info("Received request to get order by id: {}", id);
        OrderResponse order = orderService.findById(id);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", order));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getOrdersByCustomer(@PathVariable String customerId) {
        log.info("Received request to get orders for customer: {}", customerId);
        List<OrderResponse> orders = orderService.findByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Customer orders retrieved successfully", orders));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        log.info("Received request to create order for customer: {}", request.getCustomerId());
        OrderResponse createdOrder = orderService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", createdOrder));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrder(@PathVariable Long id, @Valid @RequestBody CreateOrderRequest request) {
        log.info("Received request to update order with id: {}", id);
        OrderResponse updatedOrder = orderService.updateOrder(id, request);
        return ResponseEntity.ok(ApiResponse.success("Order updated successfully", updatedOrder));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatus(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        log.info("Received request to update status for order id: {}", id);
        OrderResponse updatedOrder = orderService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updatedOrder));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<OrderResponse>> updateOrderStatusPut(@PathVariable Long id, @Valid @RequestBody UpdateOrderStatusRequest request) {
        log.info("Received request to update status (PUT) for order id: {}", id);
        OrderResponse updatedOrder = orderService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.success("Order status updated successfully", updatedOrder));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable Long id) {
        log.info("Received request to delete order id: {}", id);
        orderService.deleteById(id);
        return ResponseEntity.ok(ApiResponse.success("Order deleted successfully"));
    }
}
