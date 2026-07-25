"""
ForgeCRM API — Structured Logging

Configures structlog with JSON output for production and pretty console
output for development. Every log entry includes correlation context.

Documentation: docs/03_Backend/309_OBSERVABILITY.md
Standards: MASTER_IMPLEMENTATION_PLAN.md §12.10
"""

from __future__ import annotations

import logging
import sys
from typing import Any

import structlog
from structlog.types import EventDict, Processor


def _add_app_context(
    logger: Any,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Add application-level context to every log entry."""
    from app.core.config import get_settings

    settings = get_settings()
    event_dict.setdefault("app", settings.APP_NAME)
    event_dict.setdefault("version", settings.APP_VERSION)
    event_dict.setdefault("env", settings.APP_ENV)
    return event_dict


def _drop_color_message_key(
    logger: Any,
    method_name: str,
    event_dict: EventDict,
) -> EventDict:
    """Remove the color_message key added by uvicorn's logging."""
    event_dict.pop("color_message", None)
    return event_dict


def setup_logging(log_level: str = "INFO", log_format: str = "json") -> None:
    """
    Configure structlog and standard library logging.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL).
        log_format: Output format — 'json' for production, 'console' for development.
    """
    # Shared processors run on every log entry regardless of renderer
    shared_processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.processors.StackInfoRenderer(),
        _add_app_context,
        _drop_color_message_key,
    ]

    if log_format == "json":
        # Production: JSON output for log aggregation systems
        renderer: Processor = structlog.processors.JSONRenderer()
    else:
        # Development: Human-readable colored console output
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    # Configure the stdlib formatter for uvicorn and other stdlib loggers
    formatter = structlog.stdlib.ProcessorFormatter(
        foreign_pre_chain=shared_processors,
        processors=[
            structlog.stdlib.ProcessorFormatter.remove_processors_meta,
            renderer,
        ],
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.handlers = [handler]
    root_logger.setLevel(getattr(logging, log_level.upper(), logging.INFO))

    # Silence noisy third-party loggers
    for noisy_logger in [
        "uvicorn.access",
        "sqlalchemy.engine",
        "passlib",
        "multipart",
    ]:
        logging.getLogger(noisy_logger).setLevel(logging.WARNING)

    # Always show uvicorn errors
    logging.getLogger("uvicorn.error").setLevel(logging.ERROR)


def get_logger(name: str | None = None) -> structlog.stdlib.BoundLogger:
    """
    Get a structlog logger with the given name.

    Args:
        name: Logger name. Typically __name__ of the calling module.

    Returns:
        Configured structlog BoundLogger instance.
    """
    return structlog.get_logger(name)
