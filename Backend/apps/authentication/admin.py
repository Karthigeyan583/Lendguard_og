from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'phone_number', 'is_kyc_verified', 'created_at')
    list_filter = ('role', 'is_kyc_verified', 'created_at')
    search_fields = ('user__username', 'user__email', 'phone_number')
