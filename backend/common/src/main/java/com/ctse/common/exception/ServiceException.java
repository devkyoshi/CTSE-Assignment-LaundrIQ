package com.ctse.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Base exception for all application-level exceptions.
 * Carries an HTTP status so the global handler can map it automatically.
 */
public abstract class ServiceException extends RuntimeException {

    private final HttpStatus status;

    protected ServiceException(String message, HttpStatus status) {
        super(message);
        this.status = status;
    }

    protected ServiceException(String message, HttpStatus status, Throwable cause) {
        super(message, cause);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
