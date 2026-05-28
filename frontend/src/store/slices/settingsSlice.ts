import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  schoolName: string;
  schoolAddress: string;
  teacherName: string;
}

const initialState: SettingsState = {
  schoolName: 'Delhi Public School',
  schoolAddress: 'Sector-4, Bokaro',
  teacherName: 'Lakshya'
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<SettingsState>) {
      return { ...state, ...action.payload };
    },
    updateSchoolName(state, action: PayloadAction<string>) {
      state.schoolName = action.payload;
    },
    updateSchoolAddress(state, action: PayloadAction<string>) {
      state.schoolAddress = action.payload;
    },
    updateTeacherName(state, action: PayloadAction<string>) {
      state.teacherName = action.payload;
    }
  }
});

export const {
  setSettings,
  updateSchoolName,
  updateSchoolAddress,
  updateTeacherName
} = settingsSlice.actions;

export default settingsSlice.reducer;
