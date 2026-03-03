package com.ctse.common.config;

import com.ctse.common.handler.GlobalExceptionHandler;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;

/**
 * Spring Boot auto-configuration entry point for the common module.
 * Automatically registers the GlobalExceptionHandler when the common
 * JAR is on the classpath – no extra imports required in dependant services.
 */
@AutoConfiguration
@Import(GlobalExceptionHandler.class)
public class CommonAutoConfiguration {
}
