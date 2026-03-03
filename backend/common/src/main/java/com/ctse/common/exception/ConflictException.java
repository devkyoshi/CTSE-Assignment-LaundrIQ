package com.ctse.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a resource already exists or a duplicate key conflict occurs (HTTP 409).
 */
@ResponseStatus(HttpStatus.CONFLICT)
public class ConflictException extends ServiceException {

    public ConflictException(String message) {
        super(message, HttpStatus.CONFLICT);
    }

    public ConflictException(String resource, String field, Object value) {
        super(String.format("%s with %s '%s' already exists", resource, field, value), HttpStatus.CONFLICT);
    }
}
