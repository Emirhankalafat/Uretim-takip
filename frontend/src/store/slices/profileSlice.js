import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  data: null,
  loading: false,
  error: null
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfile: (state, action) => {
      state.data = action.payload
      state.loading = false
      state.error = null
    },
    setProfileLoading: (state, action) => {
      state.loading = action.payload
    },
    setProfileError: (state, action) => {
      state.error = action.payload
      state.loading = false
    },
    clearProfile: (state) => {
      state.data = null
      state.loading = false
      state.error = null
    }
  }
})

export const { setProfile, setProfileLoading, setProfileError, clearProfile } = profileSlice.actions
export default profileSlice.reducer 