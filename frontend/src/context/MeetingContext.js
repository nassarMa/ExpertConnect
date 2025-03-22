import { createContext, useState, useEffect, useContext } from 'react';
import { meetingAPI } from '../api';

const MeetingContext = createContext();

export const MeetingProvider = ({ children }) => {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchMeetings = async (params = {}) => {
    try {
      setLoading(true);
      const response = await meetingAPI.getMeetings(params);
      setMeetings(response.data);
      return response.data;
    } catch (error) {
      setError('Failed to fetch meetings');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getMeeting = async (id) => {
    try {
      setLoading(true);
      const response = await meetingAPI.getMeetingById(id);
      return response.data;
    } catch (error) {
      setError('Failed to fetch meeting details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const createMeeting = async (meetingData) => {
    try {
      setLoading(true);
      const response = await meetingAPI.createMeeting(meetingData);
      await fetchMeetings();
      return response.data;
    } catch (error) {
      setError('Failed to create meeting');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateMeetingStatus = async (id, statusData) => {
    try {
      setLoading(true);
      const response = await meetingAPI.updateMeetingStatus(id, statusData);
      await fetchMeetings();
      return response.data;
    } catch (error) {
      setError('Failed to update meeting status');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createReview = async (reviewData) => {
    try {
      setLoading(true);
      const response = await meetingAPI.createReview(reviewData);
      return response.data;
    } catch (error) {
      setError('Failed to submit review');
      console.error(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  return (
    <MeetingContext.Provider
      value={{
        meetings,
        loading,
        error,
        fetchMeetings,
        getMeeting,
        createMeeting,
        updateMeetingStatus,
        createReview,
      }}
    >
      {children}
    </MeetingContext.Provider>
  );
};

export const useMeetings = () => useContext(MeetingContext);

export default MeetingContext;
