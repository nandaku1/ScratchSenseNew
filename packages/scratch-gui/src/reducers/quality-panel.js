// STAGE 16 — Redux reducer for ScratchSense quality panel state

const SET_FINDINGS = 'scratch-gui/quality-panel/SET_FINDINGS';
const SET_LLM_LOADING = 'scratch-gui/quality-panel/SET_LLM_LOADING';
const SET_SUGGESTIONS = 'scratch-gui/quality-panel/SET_SUGGESTIONS';

const initialState = {
    findings: [],
    suggestions: [],
    llmLoading: false,
};

const reducer = function (state = initialState, action) {
    switch (action.type) {
    case SET_FINDINGS:
        return { ...state, findings: action.findings };
    case SET_LLM_LOADING:
        return { ...state, llmLoading: action.loading };
    case SET_SUGGESTIONS:
        return { ...state, suggestions: action.suggestions };
    default:
        return state;
    }
};

export default reducer;

export const setFindings = findings => ({ type: SET_FINDINGS, findings });
export const setLLMLoading = loading => ({ type: SET_LLM_LOADING, loading });
export const setSuggestions = suggestions => ({ type: SET_SUGGESTIONS, suggestions });

// Selectors — read from state.scratchGui.qualityPanel
export const getFindings = state => state.scratchGui.qualityPanel.findings;
export const getLLMLoading = state => state.scratchGui.qualityPanel.llmLoading;
export const getSuggestions = state => state.scratchGui.qualityPanel.suggestions;
