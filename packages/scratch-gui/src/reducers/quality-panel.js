// STAGE 16 — Redux reducer for ScratchSense quality panel state

const SET_FINDINGS = 'scratch-gui/quality-panel/SET_FINDINGS';
const SET_LLM_LOADING = 'scratch-gui/quality-panel/SET_LLM_LOADING';
const SET_SUGGESTIONS = 'scratch-gui/quality-panel/SET_SUGGESTIONS';
const SET_PARTICIPANT_ID = 'scratch-gui/quality-panel/SET_PARTICIPANT_ID';
const APPEND_SESSION_LOG = 'scratch-gui/quality-panel/APPEND_SESSION_LOG';
const CLEAR_SESSION_LOG = 'scratch-gui/quality-panel/CLEAR_SESSION_LOG';

const initialState = {
    findings: [],
    suggestions: [],
    llmLoading: false,
    participantId: '',
    sessionLog: [],
};

const reducer = function (state = initialState, action) {
    switch (action.type) {
    case SET_FINDINGS:
        return { ...state, findings: action.findings };
    case SET_LLM_LOADING:
        return { ...state, llmLoading: action.loading };
    case SET_SUGGESTIONS:
        return { ...state, suggestions: action.suggestions };
    case SET_PARTICIPANT_ID:
        return { ...state, participantId: action.id };
    case APPEND_SESSION_LOG:
        return { ...state, sessionLog: [...state.sessionLog, action.entry] };
    case CLEAR_SESSION_LOG:
        return { ...state, sessionLog: [] };
    default:
        return state;
    }
};

export default reducer;

export const setFindings = findings => ({ type: SET_FINDINGS, findings });
export const setLLMLoading = loading => ({ type: SET_LLM_LOADING, loading });
export const setSuggestions = suggestions => ({ type: SET_SUGGESTIONS, suggestions });
export const setParticipantId = id => ({ type: SET_PARTICIPANT_ID, id });
export const appendSessionLog = entry => ({ type: APPEND_SESSION_LOG, entry });
export const clearSessionLog = () => ({ type: CLEAR_SESSION_LOG });

// Selectors — read from state.scratchGui.qualityPanel
export const getFindings = state => state.scratchGui.qualityPanel.findings;
export const getLLMLoading = state => state.scratchGui.qualityPanel.llmLoading;
export const getSuggestions = state => state.scratchGui.qualityPanel.suggestions;
export const getParticipantId = state => state.scratchGui.qualityPanel.participantId;
export const getSessionLog = state => state.scratchGui.qualityPanel.sessionLog;
