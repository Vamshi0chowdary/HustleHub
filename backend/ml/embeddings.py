from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

import numpy as np
from scipy import sparse
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import normalize


def combine_tokens(*parts: Iterable[str] | str | None) -> str:
    values: list[str] = []
    for part in parts:
        if part is None:
            continue
        if isinstance(part, str):
            if part.strip():
                values.append(part.strip().lower())
            continue
        for token in part:
            cleaned = str(token).strip().lower()
            if cleaned:
                values.append(cleaned)
    return " ".join(values)


@dataclass
class EmbeddingSpace:
    vectorizer: TfidfVectorizer

    @classmethod
    def create(cls, max_features: int = 3000) -> "EmbeddingSpace":
        vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=max_features,
            min_df=1,
            norm="l2",
            sublinear_tf=True,
        )
        return cls(vectorizer=vectorizer)

    def fit_transform(self, documents: list[str]) -> sparse.csr_matrix:
        if not documents:
            documents = ["cold_start"]
        matrix = self.vectorizer.fit_transform(documents)
        return normalize(matrix, axis=1)

    def transform(self, documents: list[str]) -> sparse.csr_matrix:
        if not documents:
            documents = ["cold_start"]
        matrix = self.vectorizer.transform(documents)
        return normalize(matrix, axis=1)


def sparse_row_to_dense(matrix: sparse.csr_matrix, row_idx: int = 0) -> np.ndarray:
    return np.asarray(matrix.getrow(row_idx).toarray()[0], dtype=np.float32)
