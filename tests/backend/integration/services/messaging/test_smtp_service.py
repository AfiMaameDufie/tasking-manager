import os
from urllib.parse import urlparse, parse_qs
from unittest.mock import patch, MagicMock
from flask import current_app

from backend.services.messaging.smtp_service import SMTPService
from tests.backend.base import BaseTestCase


class TestSMTPService(BaseTestCase):
    # A debug message shown instead of the sending actual email in the testing environment

    def setUp(self):
        super().setUp()
        self.to_address = "hot-test@mailinator.com"
        self.to_username = "Iain Hunter"
        self.from_username = "Aadesh Baral"
        self.message_id = 1
        self.project_id = 1
        self.task_id = 1
        self.subject = "test subject"
        self.content = "test content"
        self.message_type = "test"

    def test_send_verification_mail(self):

        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        self.assertTrue(
            SMTPService.send_verification_email("hot-test@mailinator.com", "mrtest")
        )

    def test_send_alert(self):

        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        sent_alert = SMTPService.send_email_alert(
            to_address=self.to_address,
            username=self.to_username,
            user_email_verified=True,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        self.assertTrue(sent_alert)

    def test_send_alert_message_limits(self):

        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        for x in range(0, 10):
            sent_alert = SMTPService.send_email_alert(
                to_address=self.to_address,
                username=self.to_username,
                user_email_verified=True,
                message_id=self.message_id,
                from_username=self.from_username,
                project_id=self.project_id,
                task_id=self.task_id,
                subject=self.subject,
                content=self.content,
                message_type=self.message_type,
            )
            self.assertTrue(sent_alert)

    def test_alert_not_sent_if_email_not_supplied(self):
        if os.getenv("TM_SMTP_HOST") is None:
            return  # If SMTP not setup there's no value attempting the integration tests

        sent_alert = SMTPService.send_email_alert(
            to_address="",
            username=self.to_username,
            user_email_verified=True,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        self.assertFalse(sent_alert)

    def test_does_not_send_if_user_not_verified(self):
        sent_alert = SMTPService.send_email_alert(
            to_address=self.to_address,
            username=self.to_username,
            user_email_verified=False,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        self.assertFalse(sent_alert)

    @patch.object(SMTPService, "_send_message")
    def test_does_send_if_user_verified(self, mock_send_message):
        # Arrange
        mock_send_message.side_effect = None
        # Act
        sent_alert = SMTPService.send_email_alert(
            to_address=self.to_address,
            username=self.to_username,
            user_email_verified=True,
            message_id=self.message_id,
            from_username=self.from_username,
            project_id=self.project_id,
            task_id=self.task_id,
            subject=self.subject,
            content=self.content,
            message_type=self.message_type,
        )
        # Assert
        self.assertTrue(sent_alert)

    def test_email_verification_url_generated_correctly(self):
        # Arrange
        test_user = "mrtest"

        # Act
        url = SMTPService._generate_email_verification_url("test@test.com", test_user)

        parsed_url = urlparse(url)
        query = parse_qs(parsed_url.query)

        self.assertEqual(parsed_url.path, "/verify-email/")
        self.assertEqual(query["username"], [test_user])
        self.assertTrue(
            query["token"]
        )  # Token random every time so just check we have something

    def test_send_message_raises_error_if_sender_not_defined(self):
        # Arrange
        current_app.config["MAIL_DEFAULT_SENDER"] = None
        to_address = self.to_address
        subject = self.subject
        content = self.content

        # Act/Assert
        with self.assertRaises(ValueError):
            SMTPService._send_message(to_address, subject, content, content)
        current_app.config["MAIL_DEFAULT_SENDER"] = os.environ.get(
            "TM_EMAIL_FROM_ADDRESS", None
        )

    def test_send_message_sends_mail_if_sender_is_defined(self):
        # Arrange
        current_app.config["MAIL_DEFAULT_SENDER"] = MagicMock(None)
        to_address = self.to_address
        subject = self.subject
        content = self.content

        # Act/Assert
        SMTPService._send_message(to_address, subject, content, content)
