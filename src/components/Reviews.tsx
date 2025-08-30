import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, Flag, User } from 'lucide-react';
import { subscribeToReviewsByDestination, type Review, markReviewHelpful, reportReview } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import AddReview from './AddReview';
import { useTranslation } from '../context/TranslationContext';
import { SkeletonText } from './SkeletonLoader';

interface ReviewsProps {
  destinationId: string;
}

const Reviews: React.FC<ReviewsProps> = ({ destinationId }) => {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddReview, setShowAddReview] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToReviewsByDestination(
      destinationId,
      (newReviews) => {
        setReviews(newReviews);
        setIsLoading(false);
        
        // Check if current user has already reviewed this destination
        if (currentUser) {
          const hasReviewed = newReviews.some(review => review.userId === currentUser.uid);
          setUserHasReviewed(hasReviewed);
        }
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [destinationId, currentUser]);

  const handleReviewAdded = () => {
    setShowAddReview(false);
    setUserHasReviewed(true);
  };

  const handleMarkHelpful = async (reviewId: string) => {
    if (!currentUser) {
      alert('Please sign in to mark reviews as helpful.');
      return;
    }
    
    try {
      await markReviewHelpful(reviewId);
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      alert('Failed to mark review as helpful. Please try again.');
    }
  };

  const handleReportReview = async (reviewId: string) => {
    if (!currentUser) {
      alert('Please sign in to report reviews.');
      return;
    }
    
    if (window.confirm('Are you sure you want to report this review?')) {
      try {
        await reportReview(reviewId);
        alert('Review reported successfully. Thank you for helping us maintain quality content.');
      } catch (error) {
        console.error('Error reporting review:', error);
        alert('Failed to report review. Please try again.');
      }
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown date';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-gray-900">{t('reviews.title')}</h3>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-3 w-16 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                ))}
              </div>
              
              <div className="mb-4">
                <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mt-2"></div>
              </div>
              
              <div className="flex space-x-4">
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">{t('reviews.title')}</h3>
        {!userHasReviewed && (
          <button
            onClick={() => setShowAddReview(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {t('reviews.addReview')}
          </button>
        )}
      </div>
      
      {showAddReview && (
        <AddReview 
          destinationId={destinationId} 
          onReviewAdded={handleReviewAdded}
          onCancel={() => setShowAddReview(false)}
        />
      )}
      
      {reviews.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Star className="w-8 h-8 text-gray-400" />
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">{t('reviews.noReviews')}</h4>
          <p className="text-gray-600 mb-4">{t('reviews.beFirstToReview')}</p>
          {!userHasReviewed && (
            <button
              onClick={() => setShowAddReview(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {t('reviews.writeReview')}
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
              {/* Review Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {review.userAvatar ? (
                    <img 
                      src={review.userAvatar} 
                      alt={review.userName} 
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-orange-500" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{review.userName}</p>
                    <p className="text-sm text-gray-500">{formatDate(review.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < review.rating
                          ? 'text-orange-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Review Content */}
              <div className="mb-4">
                <h4 className="font-bold text-gray-900 mb-2">{review.title}</h4>
                <p className="text-gray-700">{review.comment}</p>
              </div>
              
              {/* Review Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleMarkHelpful(review.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-orange-500 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span className="text-sm">{t('reviews.helpful')}</span>
                    {review.helpfulCount > 0 && (
                      <span className="text-xs text-gray-400">({review.helpfulCount})</span>
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleReportReview(review.id)}
                    className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Flag className="w-4 h-4" />
                    <span className="text-sm">{t('reviews.report')}</span>
                  </button>
                </div>
                
                {review.isVerified && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reviews;