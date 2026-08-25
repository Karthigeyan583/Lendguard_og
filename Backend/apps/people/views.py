from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from drf_spectacular.utils import extend_schema
from .models import Person
from .serializers import PersonSerializer


class PersonViewSet(viewsets.ModelViewSet):
    """
    People & Contacts Management:
    Track individuals, borrower relationships, tags, and exposure.
    """
    permission_classes = [permissions.IsAuthenticated]
    queryset = Person.objects.none()
    serializer_class = PersonSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['relationship', 'is_archived']
    search_fields = ['name', 'mobile', 'email', 'tags', 'notes']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return Person.objects.none()
        user = self.request.user
        if not user.is_authenticated:
            return Person.objects.none()
        return Person.objects.filter(created_by=user)

    @extend_schema(summary="Archive Person", description="Archive contact without destroying underlying loan history.", tags=["People"])
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        person = self.get_object()
        person.is_archived = True
        person.save(update_fields=['is_archived'])
        return Response(PersonSerializer(person).data, status=status.HTTP_200_OK)

    @extend_schema(summary="Unarchive Person", description="Restore an archived contact.", tags=["People"])
    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        person = self.get_object()
        person.is_archived = False
        person.save(update_fields=['is_archived'])
        return Response(PersonSerializer(person).data, status=status.HTTP_200_OK)
