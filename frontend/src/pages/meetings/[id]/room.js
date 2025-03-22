import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useMeetings } from '../../../context/MeetingContext';
import { useAuth } from '../../../context/AuthContext';
import SimplePeer from 'simple-peer';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  IconButton,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon
} from '@mui/icons-material';
import Layout from '../../../components/Layout';
import { format } from 'date-fns';

export default function MeetingRoom() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { getMeeting, updateMeetingStatus, loading } = useMeetings();
  const [meeting, setMeeting] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [connecting, setConnecting] = useState(true);
  const [error, setError] = useState('');
  const [peer, setPeer] = useState(null);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerRef = useRef(null);
  const socketRef = useRef(null);
  
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (id) {
      const fetchMeeting = async () => {
        try {
          const meetingData = await getMeeting(id);
          setMeeting(meetingData);
          
          // Check if meeting is confirmed and scheduled time is valid
          const now = new Date();
          const meetingStart = new Date(meetingData.scheduled_start);
          const meetingEnd = new Date(meetingData.scheduled_end);
          
          if (meetingData.status !== 'confirmed') {
            setError('This meeting is not confirmed yet.');
            setConnecting(false);
            return;
          }
          
          if (now < meetingStart) {
            setError(`This meeting hasn't started yet. It will start at ${format(meetingStart, 'h:mm a')}.`);
            setConnecting(false);
            return;
          }
          
          if (now > meetingEnd) {
            setError('This meeting has already ended.');
            setConnecting(false);
            return;
          }
          
          // Check if user is part of the meeting
          if (meetingData.requester_id !== user.id && meetingData.expert_id !== user.id) {
            setError('You are not authorized to join this meeting.');
            setConnecting(false);
            return;
          }
          
          // Initialize WebRTC
          initializeMedia();
        } catch (error) {
          console.error('Failed to fetch meeting:', error);
          setError('Failed to load meeting details.');
          setConnecting(false);
        }
      };
      
      fetchMeeting();
    }
    
    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [id, user, router, getMeeting]);
  
  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize peer connection
      initializePeerConnection(stream);
    } catch (error) {
      console.error('Failed to access media devices:', error);
      setError('Failed to access camera or microphone. Please check your permissions.');
      setConnecting(false);
    }
  };
  
  const initializePeerConnection = (stream) => {
    // In a real implementation, you would use a signaling server
    // For this demo, we'll simulate the connection
    
    // Create a new peer as initiator
    const newPeer = new SimplePeer({
      initiator: meeting?.requester_id === user.id,
      trickle: false,
      stream: stream
    });
    
    newPeer.on('signal', data => {
      // In a real app, you would send this signal data to the other peer
      console.log('Signal data to send:', data);
      
      // Simulate receiving the signal from the other peer after a delay
      setTimeout(() => {
        // This is just for simulation - in a real app, this would come from the other peer
        if (peerRef.current) {
          // peerRef.current.signal(data);
        }
      }, 1000);
    });
    
    newPeer.on('connect', () => {
      console.log('Peer connection established');
      setConnecting(false);
    });
    
    newPeer.on('stream', stream => {
      console.log('Received remote stream');
      setRemoteStream(stream);
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });
    
    newPeer.on('error', err => {
      console.error('Peer connection error:', err);
      setError('Connection error. Please try refreshing the page.');
      setConnecting(false);
    });
    
    peerRef.current = newPeer;
    setPeer(newPeer);
    
    // For demo purposes, simulate a successful connection after a delay
    setTimeout(() => {
      setConnecting(false);
      
      // Create a fake remote stream for demo
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(fakeRemoteStream => {
          setRemoteStream(fakeRemoteStream);
          
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = fakeRemoteStream;
          }
        })
        .catch(err => console.error('Could not create fake remote stream:', err));
    }, 3000);
  };
  
  const toggleAudio = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };
  
  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };
  
  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Restore camera video
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
        
        // Replace the track in the peer connection
        if (peerRef.current) {
          const videoTrack = localStream.getVideoTracks()[0];
          const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }
      }
      
      setScreenSharing(false);
    } else {
      try {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true 
        });
        
        screenStreamRef.current = screenStream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        // Replace the track in the peer connection
        if (peerRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
          if (sender && videoTrack) {
            sender.replaceTrack(videoTrack);
          }
        }
        
        // Handle the case when user stops screen sharing via the browser UI
        screenStream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
        
        setScreenSharing(true);
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    }
  };
  
  const endCall = async () => {
    try {
      // Update meeting status to completed if it's the end time
      const now = new Date();
      const meetingEnd = new Date(meeting.scheduled_end);
      
      if (now >= meetingEnd) {
        await updateMeetingStatus(meeting.id, { status: 'completed' });
      }
      
      // Clean up media streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Close peer connection
      if (peerRef.current) {
        peerRef.current.destroy();
      }
      
      // Navigate back to meetings page
      router.push(`/meetings/${id}`);
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };
  
  if (loading || !meeting) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Layout>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {meeting.title}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip 
              label={`With: ${meeting.requester_id === user.id ? meeting.expert_name : meeting.requester_name}`} 
              variant="outlined" 
            />
            <Chip 
              label={`${format(new Date(meeting.scheduled_start), 'MMM dd, yyyy h:mm a')} - ${format(new Date(meeting.scheduled_end), 'h:mm a')}`} 
              variant="outlined" 
            />
            <Chip 
              label={meeting.status} 
              color={meeting.status === 'confirmed' ? 'success' : 'default'} 
            />
          </Box>
          <Typography variant="body1" paragraph>
            {meeting.description || 'No description provided.'}
          </Typography>
        </Paper>
        
        {error ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6" color="error" gutterBottom>
              {error}
            </Typography>
            <Button 
              variant="contained" 
              onClick={() => router.push(`/meetings/${id}`)}
              sx={{ mt: 2 }}
            >
              Back to Meeting Details
            </Button>
          </Paper>
        ) : (
          <>
            <Grid container spacing={3}>
              {/* Video Streams */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Your Video
                  </Typography>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 300, 
                      bgcolor: 'black',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      position: 'relative'
                    }}
                  >
                    {connecting ? (
                      <CircularProgress color="primary" />
                    ) : (
                      <video
                        ref={localVideoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                    
                    {!videoEnabled && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%', 
                          bgcolor: 'rgba(0, 0, 0, 0.7)',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}
                      >
                        <Typography variant="h6" color="white">
                          Camera Off
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    {meeting.requester_id === user.id ? meeting.expert_name : meeting.requester_name}'s Video
                  </Typography>
                  <Box 
                    sx={{ 
                      width: '100%', 
                      height: 300, 
                      bgcolor: 'black',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center'
                    }}
                  >
                    {connecting ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <CircularProgress color="primary" sx={{ mb: 2 }} />
                        <Typography variant="body1" color="white">
                          Connecting...
                        </Typography>
                      </Box>
                    ) : remoteStream ? (
                      <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Typography variant="body1" color="white">
                        Waiting for other participant...
                      </Typography>
                    )}
                  </Box>
                </Paper>
              </Grid>
            </Grid>
            
            {/* Controls */}
            <Paper sx={{ p: 2, mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton 
                color={audioEnabled ? 'primary' : 'error'} 
                onClick={toggleAudio}
                sx={{ 
                  bgcolor: audioEnabled ? 'rgba(25, 118, 210, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                  '&:hover': {
                    bgcolor: audioEnabled ? 'rgba(25, 118, 210, 0.2)' : 'rgba(211, 47, 47, 0.2)',
                  }
                }}
              >
                {audioEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
              
              <IconButton 
                color={videoEnabled ? 'primary' : 'error'} 
                onClick={toggleVideo}
                sx={{ 
                  bgcolor: videoEnabled ? 'rgba(25, 118, 210, 0.1)' : 'rgba(211, 47, 47, 0.1)',
                  '&:hover': {
                    bgcolor: videoEnabled ? 'rgba(25, 118, 210, 0.2)' : 'rgba(211, 47, 47, 0.2)',
                  }
                }}
              >
                {videoEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              
              <IconButton 
                color={screenSharing ? 'secondary' : 'primary'} 
                onClick={toggleScreenShare}
                sx={{ 
                  bgcolor: screenSharing ? 'rgba(156, 39, 176, 0.1)' : 'rgba(25, 118, 210, 0.1)',
                  '&:hover': {
                    bgcolor: screenSharing ? 'rgba(156, 39, 176, 0.2)' : 'rgba(25, 118, 210, 0.2)',
                  }
                }}
              >
                {screenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
              
              <IconButton 
                color="error" 
                onClick={endCall}
                sx={{ 
                  bgcolor: 'rgba(211, 47, 47, 0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(211, 47, 47, 0.2)',
                  }
                }}
              >
                <CallEndIcon />
              </IconButton>
            </Paper>
          </>
        )}
      </Container>
    </Layout>
  );
}
