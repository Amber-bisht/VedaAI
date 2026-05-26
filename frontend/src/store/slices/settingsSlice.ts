import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  schoolName: string;
  schoolAddress: string;
  subject: string;
  className: string;
  teacherName: string;
}

const initialState: SettingsState = {
  schoolName: 'Delhi Public School',
  schoolAddress: 'Sector-4, Bokaro',
  subject: 'Science',
  className: '8th',
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
    updateSubject(state, action: PayloadAction<string>) {
      state.subject = action.payload;
    },
    updateClassName(state, action: PayloadAction<string>) {
      state.className = action.payload;
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
  updateSubject,
  updateClassName,
  updateTeacherName
} = settingsSlice.actions;

export default settingsSlice.reducer;
