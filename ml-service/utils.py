"""
Custom Sklearn Transformers

These transformers extract specific columns from a DataFrame for use in
sklearn Pipeline and FeatureUnion constructs.

Used by train_model_v2.py and app.py for feature extraction.

Transformer Classes:
    - TextExtractor: Extracts 'query_text' column for TF-IDF
    - UrgencyExtractor: Extracts 'urgency_num' column as numeric feature
"""

from sklearn.base import BaseEstimator, TransformerMixin


class TextExtractor(BaseEstimator, TransformerMixin):
    """
    Extracts the 'query_text' column from a DataFrame.
    
    Used in the text pipeline before TF-IDF vectorization.
    Input: DataFrame with 'query_text' column
    Output: 1D array of text strings
    
    Example:
        text_pipeline = Pipeline([
            ("extract", TextExtractor()),
            ("tfidf", TfidfVectorizer())
        ])
    """
    
    def fit(self, X, y=None):
        """No fitting required - stateless transformer."""
        return self
    
    def transform(self, X):
        """
        Extract query_text column as array.
        
        Args:
            X: DataFrame with 'query_text' column
            
        Returns:
            numpy.ndarray: 1D array of query text strings
        """
        return X["query_text"].values


class UrgencyExtractor(BaseEstimator, TransformerMixin):
    """
    Extracts the 'urgency_num' column from a DataFrame.
    
    Used in FeatureUnion to add urgency as a numeric feature
    alongside TF-IDF text features.
    
    Urgency mapping:
        - high: 2
        - normal: 1
        - low: 0
    
    Input: DataFrame with 'urgency_num' column
    Output: 2D array (n_samples, 1)
    """
    
    def fit(self, X, y=None):
        """No fitting required - stateless transformer."""
        return self
    
    def transform(self, X):
        """
        Extract urgency_num column as 2D array.
        
        Args:
            X: DataFrame with 'urgency_num' column
            
        Returns:
            numpy.ndarray: 2D array of shape (n_samples, 1)
        """
        return X[["urgency_num"]].values
