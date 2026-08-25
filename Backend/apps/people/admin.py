from django.contrib import admin
from .models import Person


@admin.register(Person)
class PersonAdmin(admin.ModelAdmin):
    list_display = ('name', 'relationship', 'mobile', 'email', 'created_by', 'is_archived')
    list_filter = ('relationship', 'is_archived')
    search_fields = ('name', 'mobile', 'email', 'tags')
