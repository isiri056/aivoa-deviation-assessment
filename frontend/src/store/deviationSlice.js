import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  logDeviationAPI,
  editDeviationAPI,
  extractDocumentAPI,
  saveDeviationAPI,
  getDeviationsAPI,
  getHealthAPI,
} from '../services/api';

const initialDeviation = {
  site_plant: '',
  date_of_occurrence: '',
  title: '',
  source: '',
  product_material: '',
  batch_lot_number: '',
  affected_quantity: '',
  detailed_description: '',
};

const initialAssessment = {
  impact: '',
  severity: '',
  reason: '',
  recommended_action: '',
};

export const logDeviation = createAsyncThunk(
  'deviation/logDeviation',
  async ({ text }, { getState, rejectWithValue }) => {
    try {
      const state = getState().deviation;
      const data = await logDeviationAPI(text, state.deviation);
      return { text, data };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to log deviation';
      return rejectWithValue(msg);
    }
  }
);

export const editDeviation = createAsyncThunk(
  'deviation/editDeviation',
  async ({ instruction }, { getState, rejectWithValue }) => {
    try {
      const state = getState().deviation;
      const data = await editDeviationAPI(instruction, state.deviation, state.assessment);
      return { instruction, data };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to edit deviation';
      return rejectWithValue(msg);
    }
  }
);

export const extractDocument = createAsyncThunk(
  'deviation/extractDocument',
  async ({ file }, { rejectWithValue }) => {
    try {
      const data = await extractDocumentAPI(file);
      return { fileName: file.name, data };
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Document extraction failed';
      return rejectWithValue(msg);
    }
  }
);

export const saveDeviation = createAsyncThunk(
  'deviation/saveDeviation',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { deviation, assessment } = getState().deviation;
      const payload = {
        site_plant: deviation.site_plant,
        date_of_occurrence: deviation.date_of_occurrence,
        title: deviation.title,
        source: deviation.source,
        product_material: deviation.product_material || '',
        batch_lot_number: deviation.batch_lot_number || '',
        affected_quantity: deviation.affected_quantity || '',
        detailed_description: deviation.detailed_description,
        initial_impact: assessment.impact,
        initial_severity: assessment.severity,
        severity_reason: assessment.reason || '',
        recommended_action: assessment.recommended_action || '',
      };
      const result = await saveDeviationAPI(payload);
      return result;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Failed to save deviation to database';
      return rejectWithValue(msg);
    }
  }
);

export const fetchSavedDeviations = createAsyncThunk(
  'deviation/fetchSavedDeviations',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getDeviationsAPI();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const checkHealth = createAsyncThunk(
  'deviation/checkHealth',
  async (_, { rejectWithValue }) => {
    try {
      const data = await getHealthAPI();
      return data;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const deviationSlice = createSlice({
  name: 'deviation',
  initialState: {
    deviation: { ...initialDeviation },
    assessment: { ...initialAssessment },
    aiPopulatedFields: {}, // { fieldName: boolean }
    uploadedFileName: null,
    messages: [
      {
        id: 'welcome-msg',
        sender: 'assistant',
        text: 'Welcome to the AI Deviation Assistant. Upload a deviation PDF/TXT or paste your incident narrative to automatically log and assess the event.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ],
    processingState: {
      isProcessing: false,
      isUploading: false,
      isSaving: false,
    },
    error: null,
    saveSuccess: false,
    savedRecordId: null,
    savedDeviationsList: [],
    healthStatus: null,
  },
  reducers: {
    updateField: (state, action) => {
      const { field, value } = action.payload;
      state.deviation[field] = value;
      // If user manually edits, clear AI indicator or keep it noted
    },
    updateAssessmentField: (state, action) => {
      const { field, value } = action.payload;
      state.assessment[field] = value;
    },
    resetForm: (state) => {
      state.deviation = { ...initialDeviation };
      state.assessment = { ...initialAssessment };
      state.aiPopulatedFields = {};
      state.uploadedFileName = null;
      state.error = null;
      state.saveSuccess = false;
      state.savedRecordId = null;
      state.messages.push({
        id: `reset-${Date.now()}`,
        sender: 'assistant',
        text: 'The deviation form has been reset to its pristine state. You can log a new deviation at any time.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    },
    clearError: (state) => {
      state.error = null;
    },
    dismissSaveSuccess: (state) => {
      state.saveSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // --- LOG DEVIATION ---
    builder
      .addCase(logDeviation.pending, (state, action) => {
        state.processingState.isProcessing = true;
        state.error = null;
        state.messages.push({
          id: `user-${Date.now()}`,
          sender: 'user',
          text: action.meta.arg.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      })
      .addCase(logDeviation.fulfilled, (state, action) => {
        state.processingState.isProcessing = false;
        const { data } = action.payload;

        // Populate entire deviation form
        if (data.deviation) {
          state.deviation = { ...state.deviation, ...data.deviation };
          // Mark fields populated by AI
          const aiFlags = {};
          Object.keys(data.deviation).forEach((k) => {
            if (data.deviation[k]) aiFlags[k] = true;
          });
          state.aiPopulatedFields = aiFlags;
        }

        if (data.assessment) {
          state.assessment = { ...data.assessment };
        }

        state.messages.push({
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.message || 'Deviation logged and assessed successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'log_deviation',
        });
      })
      .addCase(logDeviation.rejected, (state, action) => {
        state.processingState.isProcessing = false;
        state.error = action.payload;
        state.messages.push({
          id: `error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `Error: ${action.payload}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });

    // --- EDIT DEVIATION (CRITICAL: MERGE ONLY CHANGED FIELDS) ---
    builder
      .addCase(editDeviation.pending, (state, action) => {
        state.processingState.isProcessing = true;
        state.error = null;
        state.messages.push({
          id: `user-${Date.now()}`,
          sender: 'user',
          text: action.meta.arg.instruction,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      })
      .addCase(editDeviation.fulfilled, (state, action) => {
        state.processingState.isProcessing = false;
        const { data } = action.payload;

        // MERGE ONLY CHANGED FIELDS: Do NOT replace the entire object!
        if (data.updates && typeof data.updates === 'object') {
          Object.entries(data.updates).forEach(([key, val]) => {
            if (key in state.deviation) {
              state.deviation[key] = val;
              state.aiPopulatedFields[key] = true; // Mark as updated by AI
            }
          });
        }

        if (data.assessment && Object.keys(data.assessment).length > 0) {
          state.assessment = { ...state.assessment, ...data.assessment };
        }

        state.messages.push({
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.message || 'Deviation fields updated.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'edit_deviation',
          updates: data.updates,
        });
      })
      .addCase(editDeviation.rejected, (state, action) => {
        state.processingState.isProcessing = false;
        state.error = action.payload;
        state.messages.push({
          id: `error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          text: `Error: ${action.payload}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });

    // --- DOCUMENT EXTRACTION ---
    builder
      .addCase(extractDocument.pending, (state, action) => {
        state.processingState.isUploading = true;
        state.error = null;
        state.messages.push({
          id: `user-doc-${Date.now()}`,
          sender: 'user',
          text: `Uploaded document: ${action.meta.arg.file.name}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fileUploadName: action.meta.arg.file.name,
          requestId: action.meta.requestId,
        });
      })
      .addCase(extractDocument.fulfilled, (state, action) => {
        state.processingState.isUploading = false;
        const { data, fileName } = action.payload;
        const targetFileName = fileName || action.meta.arg?.file?.name;

        // Identify current upload user message
        const currentReqId = action.meta.requestId;
        let currentUserMsg = state.messages.find((m) => m.requestId === currentReqId);
        if (!currentUserMsg && targetFileName) {
          for (let i = state.messages.length - 1; i >= 0; i--) {
            if (
              state.messages[i].sender === 'user' &&
              (state.messages[i].fileUploadName === targetFileName ||
                state.messages[i].text === `Uploaded document: ${targetFileName}`)
            ) {
              currentUserMsg = state.messages[i];
              break;
            }
          }
        }
        if (currentUserMsg) {
          currentUserMsg.completed = true;
        }

        // Remove previous failed upload attempt and its associated error message for this filename
        if (targetFileName) {
          const idsToRemove = new Set();
          for (let i = 0; i < state.messages.length; i++) {
            const msg = state.messages[i];
            if (
              msg !== currentUserMsg &&
              msg.sender === 'user' &&
              (msg.fileUploadName === targetFileName ||
                msg.text === `Uploaded document: ${targetFileName}`)
            ) {
              const nextMsg = state.messages[i + 1];
              if (nextMsg && nextMsg.sender === 'assistant' && nextMsg.isError) {
                idsToRemove.add(msg.id);
                idsToRemove.add(nextMsg.id);
              } else if (msg.uploadFailed) {
                idsToRemove.add(msg.id);
              }
            }
            if (msg.isError && msg.failedUploadName === targetFileName) {
              idsToRemove.add(msg.id);
            }
          }

          if (idsToRemove.size > 0) {
            state.messages = state.messages.filter((m) => !idsToRemove.has(m.id));
          }
        }

        state.uploadedFileName = targetFileName;

        if (data.deviation) {
          state.deviation = { ...state.deviation, ...data.deviation };
          const aiFlags = {};
          Object.keys(data.deviation).forEach((k) => {
            if (data.deviation[k]) aiFlags[k] = true;
          });
          state.aiPopulatedFields = aiFlags;
        }

        if (data.assessment) {
          state.assessment = { ...data.assessment };
        }

        state.messages.push({
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          text: data.message || 'Document parsed and fields extracted successfully.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          action: 'extract_document',
        });
      })
      .addCase(extractDocument.rejected, (state, action) => {
        state.processingState.isUploading = false;
        state.uploadedFileName = null;

        let errorText = action.payload || 'Document extraction failed.';
        if (
          typeof errorText === 'string' &&
          (errorText.toLowerCase().includes('no extractable text') ||
            errorText.toLowerCase().includes('scanned or empty') ||
            errorText.toLowerCase().includes('could not extract readable text') ||
            errorText.toLowerCase().includes('failed to extract text from pdf'))
        ) {
          errorText = 'Unable to extract text from this PDF. Please upload a text-based PDF or TXT file.';
        } else if (typeof errorText === 'string' && !errorText.startsWith('Upload Error:')) {
          errorText = `Upload Error: ${errorText}`;
        }
        state.error = errorText;
        const fileName = action.meta.arg?.file?.name;

        // Tag the pending user upload message as failed
        const userMsg = state.messages.find(
          (m) =>
            m.requestId === action.meta.requestId ||
            (m.sender === 'user' && m.fileUploadName === fileName && !m.completed)
        );
        if (userMsg) {
          userMsg.uploadFailed = true;
        }

        state.messages.push({
          id: `error-${Date.now()}`,
          sender: 'assistant',
          isError: true,
          failedUploadName: fileName,
          requestId: action.meta.requestId,
          text: errorText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      });

    // --- SAVE DEVIATION ---
    builder
      .addCase(saveDeviation.pending, (state) => {
        state.processingState.isSaving = true;
        state.error = null;
        state.saveSuccess = false;
      })
      .addCase(saveDeviation.fulfilled, (state, action) => {
        state.processingState.isSaving = false;
        state.saveSuccess = true;
        state.savedRecordId = action.payload.id;
        state.savedDeviationsList.unshift(action.payload);
        state.messages.push({
          id: `ai-save-${Date.now()}`,
          sender: 'assistant',
          text: `Success: Deviation record #${action.payload.id} successfully persisted in the database.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      })
      .addCase(saveDeviation.rejected, (state, action) => {
        state.processingState.isSaving = false;
        state.error = action.payload;
      });

    // --- FETCH SAVED DEVIATIONS ---
    builder.addCase(fetchSavedDeviations.fulfilled, (state, action) => {
      state.savedDeviationsList = action.payload;
    });

    // --- CHECK HEALTH ---
    builder.addCase(checkHealth.fulfilled, (state, action) => {
      state.healthStatus = action.payload;
    });
  },
});

export const { updateField, updateAssessmentField, resetForm, clearError, dismissSaveSuccess } =
  deviationSlice.actions;

export default deviationSlice.reducer;
