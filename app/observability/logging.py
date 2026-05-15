import logging
import sys

def setup_logging():
    logging.basicConfig(
        stream=sys.stdout,
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    # Silence third-party logs
    logging.getLogger("passlib").setLevel(logging.ERROR)
    logging.getLogger("asyncio").setLevel(logging.WARNING)

logger = logging.getLogger("flowforge")
