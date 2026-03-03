package com.ctse.common.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when the caller is authenticated but lacks the required permissions (HTTP 403).
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends ServiceException {

    public ForbiddenException(String message) {
        super(message, HttpStatus.FORBIDDEN);
    }

    public ForbiddenException() {
        super("You do not have permission to perform this action", HttpStatus.FORBIDDEN);
    }
}
