from django.urls import path
from .views import RegisterAPIView, LoginAPIView, LogoutAPIView, UserProfileAPIView, ChangePasswordAPIView

urlpatterns = [
    path('register/', RegisterAPIView.as_view(), name='auth-register'),
    path('login/', LoginAPIView.as_view(), name='auth-login'),
    path('logout/', LogoutAPIView.as_view(), name='auth-logout'),
    path('profile/', UserProfileAPIView.as_view(), name='auth-profile'),
    path('change-password/', ChangePasswordAPIView.as_view(), name='auth-change-password'),
]
