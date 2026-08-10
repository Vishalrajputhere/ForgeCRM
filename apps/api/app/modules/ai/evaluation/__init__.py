"""
ForgeCRM — Enterprise AI Evaluation & Benchmarking Module (Phase 7.5.1)
"""

from app.modules.ai.evaluation.metrics import EvaluationMetrics, QualityScoreCalculator
from app.modules.ai.evaluation.datasets import GoldenDatasetManager
from app.modules.ai.evaluation.regression import PromptRegressionSuite
from app.modules.ai.evaluation.benchmarks import BenchmarkRunner
from app.modules.ai.evaluation.engine import EvaluationEngine

__all__ = [
    "EvaluationMetrics",
    "QualityScoreCalculator",
    "GoldenDatasetManager",
    "PromptRegressionSuite",
    "BenchmarkRunner",
    "EvaluationEngine",
]
