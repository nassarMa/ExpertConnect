"""
WebSocket consumer for chat functionality.
"""

import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from expertconnect.messaging.models import Message
from expertconnect.users.models import User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        sender_id = text_data_json['sender_id']
        receiver_id = text_data_json['receiver_id']
        meeting_id = text_data_json.get('meeting_id', None)

        # Save message to database
        await self.save_message(sender_id, receiver_id, message, meeting_id)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': sender_id,
                'receiver_id': receiver_id,
                'meeting_id': meeting_id
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event['message']
        sender_id = event['sender_id']
        receiver_id = event['receiver_id']
        meeting_id = event.get('meeting_id')

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'message': message,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'meeting_id': meeting_id
        }))

    @database_sync_to_async
    def save_message(self, sender_id, receiver_id, message_content, meeting_id=None):
        sender = User.objects.get(id=sender_id)
        receiver = User.objects.get(id=receiver_id)
        
        message = Message(
            sender=sender,
            receiver=receiver,
            message_content=message_content
        )
        
        if meeting_id:
            from expertconnect.meetings.models import Meeting
            meeting = Meeting.objects.get(id=meeting_id)
            message.related_meeting = meeting
            
        message.save()
        return message
