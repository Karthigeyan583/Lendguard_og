from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from drf_spectacular.utils import extend_schema, OpenApiResponse
from .serializers import (
    RegisterSerializer, 
    LoginSerializer, 
    UserDetailSerializer, 
    UserProfileSerializer,
    ChangePasswordSerializer
)


class RegisterAPIView(generics.CreateAPIView):
    """
    Register a new user account with role-based profile and personal lending ledger workspace.
    """
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    @extend_schema(
        summary="User Registration",
        description="Register a new user in the Lendguard platform (email and username unique validation).",
        responses={
            201: UserDetailSerializer,
            400: OpenApiResponse(description="Validation error")
        },
        tags=["Authentication"]
    )
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "message": "User registered successfully.",
            "user": UserDetailSerializer(user).data,
            "token": token.key
        }, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """
    Authenticate user via username OR email and obtain Auth Token.
    """
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    @extend_schema(
        summary="User Login",
        description="Authenticate with username OR email & password to receive an auth token.",
        request=LoginSerializer,
        responses={
            200: OpenApiResponse(description="Authentication successful"),
            400: OpenApiResponse(description="Invalid credentials")
        },
        tags=["Authentication"]
    )
    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "message": "Login successful.",
            "token": token.key,
            "user": UserDetailSerializer(user).data
        }, status=status.HTTP_200_OK)


class LogoutAPIView(APIView):
    """
    Log out the authenticated user by deleting their auth token.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        summary="User Logout",
        description="Invalidate the active authentication token.",
        request=None,
        responses={
            200: OpenApiResponse(description="Successfully logged out.")
        },
        tags=["Authentication"]
    )
    def post(self, request):
        try:
            request.user.auth_token.delete()
        except Exception:
            pass
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


class UserProfileAPIView(generics.RetrieveUpdateAPIView):
    """
    Retrieve or update the authenticated user's profile details.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = UserDetailSerializer

    @extend_schema(
        summary="Get Current User Profile",
        description="Get profile information for the currently authenticated user.",
        tags=["Authentication"]
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_object(self):
        return self.request.user


class ChangePasswordAPIView(APIView):
    """
    Change password for authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    @extend_schema(
        summary="Change Password",
        description="Update password after verifying the existing password.",
        request=ChangePasswordSerializer,
        responses={
            200: OpenApiResponse(description="Password changed successfully.")
        },
        tags=["Authentication"]
    )
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Re-issue token
        Token.objects.filter(user=user).delete()
        new_token = Token.objects.create(user=user)

        return Response({
            "message": "Password changed successfully.",
            "token": new_token.key
        }, status=status.HTTP_200_OK)
