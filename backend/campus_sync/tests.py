from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from campus_students.models import Student
import uuid
from django.utils import timezone
from datetime import timedelta

class SyncTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.push_url = reverse('sync-push')
        self.pull_url = reverse('sync-pull')

    def test_sync_push_create_student(self):
        """Test pushing a new student creation mutation."""
        student_id = str(uuid.uuid4())
        payload = {
            "mutations": [
                {
                    "table": "students",
                    "action": "CREATE",
                    "record_id": student_id,
                    "data": {
                        "id": student_id,
                        "admission_number": "ST-100",
                        "first_name": "John",
                        "last_name": "Doe",
                        "date_of_birth": "2015-05-10",
                        "gender": "Male",
                        "guardian_name": "Mr. Doe",
                        "guardian_contact": "0244444444",
                        "updated_at": timezone.now().isoformat()
                    }
                }
            ]
        }
        
        response = self.client.post(self.push_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'success')
        self.assertEqual(response.data['results'][0]['status'], 'applied')
        
        # Verify student exists in DB
        student = Student.objects.get(id=student_id)
        self.assertEqual(student.first_name, "John")
        self.assertEqual(student.last_name, "Doe")

    def test_sync_push_conflict_resolution_lww(self):
        """Test conflict resolution: server has newer record, client update is skipped."""
        student_id = str(uuid.uuid4())
        
        # Create student on server first
        student = Student.objects.create(
            id=student_id,
            admission_number="ST-200",
            first_name="Server Version",
            last_name="Doe",
            date_of_birth="2015-05-10",
            gender="Male",
            guardian_name="Mr. Doe",
            guardian_contact="0244444444"
        )
        
        # Artificially set server updated_at to be in the future relative to client using .update() to bypass auto_now
        Student.objects.filter(id=student_id).update(updated_at=timezone.now() + timedelta(minutes=5))
        
        # Push client mutation with older updated_at
        payload = {
            "mutations": [
                {
                    "table": "students",
                    "action": "UPDATE",
                    "record_id": student_id,
                    "data": {
                        "id": student_id,
                        "first_name": "Stale Client Version",
                        "updated_at": timezone.now().isoformat()
                    }
                }
            ]
        }
        
        response = self.client.post(self.push_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['results'][0]['status'], 'skipped')
        
        # Student name on server should remain unchanged
        student.refresh_from_db()
        self.assertEqual(student.first_name, "Server Version")

    def test_sync_pull_records(self):
        """Test pulling new records incrementally."""
        # Create a student on server
        student = Student.objects.create(
            admission_number="ST-300",
            first_name="Jane",
            last_name="Doe",
            date_of_birth="2016-06-12",
            gender="Female",
            guardian_name="Mrs. Doe",
            guardian_contact="0245555555"
        )
        
        # Pull changes with last_sync in the past
        past_time = (timezone.now() - timedelta(minutes=5)).isoformat()
        response = self.client.get(f"{self.pull_url}?last_sync={past_time}")
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('changes', response.data)
        self.assertEqual(len(response.data['changes']['students']), 1)
        self.assertEqual(response.data['changes']['students'][0]['id'], str(student.id))

