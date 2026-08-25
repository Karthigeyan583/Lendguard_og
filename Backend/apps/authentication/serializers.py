from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework.authtoken.models import Token
from .models import UserProfile
from apps.workspaces.models import Workspace, WorkspaceMember


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ('role', 'phone_number', 'is_kyc_verified', 'created_at')
        read_only_fields = ('is_kyc_verified', 'created_at')


class UserDetailSerializer(serializers.ModelSerializer):
    phone_number = serializers.CharField(source='profile.phone_number', required=False, allow_blank=True)
    role = serializers.CharField(source='profile.role', read_only=True)
    is_kyc_verified = serializers.BooleanField(source='profile.is_kyc_verified', read_only=True)
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone_number', 'role', 'is_kyc_verified', 'profile')
        read_only_fields = ('id', 'username')

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', {})
        phone_number = profile_data.get('phone_number')
        
        instance.first_name = validated_data.get('first_name', instance.first_name).strip()
        instance.last_name = validated_data.get('last_name', instance.last_name).strip()
        if 'email' in validated_data:
            instance.email = validated_data['email'].strip().lower()
        instance.save()

        if phone_number is not None and hasattr(instance, 'profile'):
            instance.profile.phone_number = phone_number.strip()
            instance.profile.save(update_fields=['phone_number'])

        return instance


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, min_length=6)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, default='borrower', write_only=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'password', 'role', 'phone_number')

    def validate_username(self, value):
        cleaned = value.strip().lower()
        if User.objects.filter(username__iexact=cleaned).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return cleaned

    def validate_email(self, value):
        cleaned = value.strip().lower()
        if User.objects.filter(email__iexact=cleaned).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return cleaned

    def create(self, validated_data):
        role = validated_data.pop('role', 'borrower')
        phone_number = validated_data.pop('phone_number', '')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            first_name=validated_data.get('first_name', '').strip(),
            last_name=validated_data.get('last_name', '').strip(),
            password=password
        )

        profile = user.profile
        profile.role = role
        profile.phone_number = phone_number
        profile.is_kyc_verified = True
        profile.save()

        # Create personal workspace for the new user
        display_name = user.first_name or user.username
        ws = Workspace.objects.create(
            owner=user,
            name=f"{display_name}'s Ledger",
            default_currency='INR',
            is_personal=True
        )
        WorkspaceMember.objects.create(workspace=ws, user=user, role='owner')

        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(help_text="Enter your username or registered email address")
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        identifier = data.get('username', '').strip()
        password = data.get('password', '')

        if not identifier or not password:
            raise serializers.ValidationError('Must include username/email and password.')

        user = None

        # Check if email was provided instead of username
        if '@' in identifier:
            user_obj = User.objects.filter(email__iexact=identifier).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)
        else:
            user = authenticate(username=identifier, password=password)

        if not user:
            raise serializers.ValidationError('Invalid username/email or password.')
        if not user.is_active:
            raise serializers.ValidationError('User account is disabled.')

        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value
