from sklearn.base import BaseEstimator, TransformerMixin

class TextExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X): return X["query_text"].values

class UrgencyExtractor(BaseEstimator, TransformerMixin):
    def fit(self, X, y=None): return self
    def transform(self, X): return X[["urgency_num"]].values
