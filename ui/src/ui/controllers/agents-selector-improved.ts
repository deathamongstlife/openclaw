/**
 * Improved agent selector with scrolling, search, and pagination
 * Addresses issue #43312 - Control UI agent selector doesn't show all agents
 */

import type { Agent } from "../types.ts";

export type AgentSelectorState = {
  allAgents: Agent[];
  filteredAgents: Agent[];
  displayedAgents: Agent[];
  searchQuery: string;
  selectedAgentId: string | null;
  isOpen: boolean;
  scrollOffset: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
};

const ITEMS_PER_PAGE = 50;

/**
 * Filter agents by search query
 */
export function filterAgents(agents: Agent[], query: string): Agent[] {
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) {
    return agents;
  }

  return agents.filter((agent) => {
    const id = agent.id?.toLowerCase() || "";
    const name = agent.name?.toLowerCase() || "";
    const description = agent.description?.toLowerCase() || "";

    return (
      id.includes(lowerQuery) ||
      name.includes(lowerQuery) ||
      description.includes(lowerQuery)
    );
  });
}

/**
 * Update displayed agents based on pagination
 */
export function updateDisplayedAgents(state: AgentSelectorState) {
  const startIndex = state.currentPage * state.itemsPerPage;
  const endIndex = startIndex + state.itemsPerPage;
  state.displayedAgents = state.filteredAgents.slice(startIndex, endIndex);
  state.totalPages = Math.ceil(state.filteredAgents.length / state.itemsPerPage);
}

/**
 * Search agents with debouncing
 */
let searchTimeout: number | null = null;

export function searchAgents(
  state: AgentSelectorState,
  query: string,
  debounceMs = 200,
  callback?: () => void,
) {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  searchTimeout = window.setTimeout(() => {
    state.searchQuery = query;
    state.filteredAgents = filterAgents(state.allAgents, query);
    state.currentPage = 0;
    updateDisplayedAgents(state);
    if (callback) {
      callback();
    }
  }, debounceMs);
}

/**
 * Navigate to next page
 */
export function nextPage(state: AgentSelectorState) {
  if (state.currentPage < state.totalPages - 1) {
    state.currentPage++;
    updateDisplayedAgents(state);
  }
}

/**
 * Navigate to previous page
 */
export function previousPage(state: AgentSelectorState) {
  if (state.currentPage > 0) {
    state.currentPage--;
    updateDisplayedAgents(state);
  }
}

/**
 * Go to specific page
 */
export function goToPage(state: AgentSelectorState, page: number) {
  if (page >= 0 && page < state.totalPages) {
    state.currentPage = page;
    updateDisplayedAgents(state);
  }
}

/**
 * Select an agent
 */
export function selectAgent(state: AgentSelectorState, agentId: string) {
  state.selectedAgentId = agentId;
  state.isOpen = false;
}

/**
 * Initialize agent selector state
 */
export function initializeAgentSelector(agents: Agent[]): AgentSelectorState {
  const state: AgentSelectorState = {
    allAgents: agents,
    filteredAgents: agents,
    displayedAgents: [],
    searchQuery: "",
    selectedAgentId: null,
    isOpen: false,
    scrollOffset: 0,
    itemsPerPage: ITEMS_PER_PAGE,
    currentPage: 0,
    totalPages: 0,
  };

  updateDisplayedAgents(state);
  return state;
}

/**
 * Handle keyboard navigation
 */
export function handleKeyboardNavigation(
  state: AgentSelectorState,
  event: KeyboardEvent,
): boolean {
  if (!state.isOpen) {
    return false;
  }

  switch (event.key) {
    case "ArrowDown": {
      const currentIndex = state.displayedAgents.findIndex(
        (a) => a.id === state.selectedAgentId,
      );
      if (currentIndex < state.displayedAgents.length - 1) {
        state.selectedAgentId = state.displayedAgents[currentIndex + 1].id;
      } else if (state.currentPage < state.totalPages - 1) {
        nextPage(state);
        state.selectedAgentId = state.displayedAgents[0]?.id ?? null;
      }
      return true;
    }
    case "ArrowUp": {
      const currentIndex = state.displayedAgents.findIndex(
        (a) => a.id === state.selectedAgentId,
      );
      if (currentIndex > 0) {
        state.selectedAgentId = state.displayedAgents[currentIndex - 1].id;
      } else if (state.currentPage > 0) {
        previousPage(state);
        state.selectedAgentId =
          state.displayedAgents[state.displayedAgents.length - 1]?.id ?? null;
      }
      return true;
    }
    case "Enter": {
      if (state.selectedAgentId) {
        selectAgent(state, state.selectedAgentId);
      }
      return true;
    }
    case "Escape":
      state.isOpen = false;
      return true;
    case "PageDown":
      nextPage(state);
      return true;
    case "PageUp":
      previousPage(state);
      return true;
    default:
      return false;
  }
}

/**
 * Get agent display name
 */
export function getAgentDisplayName(agent: Agent): string {
  return agent.name || agent.id || "Unknown Agent";
}

/**
 * Sort agents by relevance to search query
 */
export function sortAgentsByRelevance(agents: Agent[], query: string): Agent[] {
  if (!query.trim()) {
    return agents;
  }

  const lowerQuery = query.toLowerCase();

  return [...agents].sort((a, b) => {
    const aId = a.id?.toLowerCase() || "";
    const bId = b.id?.toLowerCase() || "";
    const aName = a.name?.toLowerCase() || "";
    const bName = b.name?.toLowerCase() || "";

    const aIdMatch = aId === lowerQuery;
    const bIdMatch = bId === lowerQuery;
    if (aIdMatch && !bIdMatch) return -1;
    if (!aIdMatch && bIdMatch) return 1;

    const aNameMatch = aName === lowerQuery;
    const bNameMatch = bName === lowerQuery;
    if (aNameMatch && !bNameMatch) return -1;
    if (!aNameMatch && bNameMatch) return 1;

    const aIdStarts = aId.startsWith(lowerQuery);
    const bIdStarts = bId.startsWith(lowerQuery);
    if (aIdStarts && !bIdStarts) return -1;
    if (!aIdStarts && bIdStarts) return 1;

    const aNameStarts = aName.startsWith(lowerQuery);
    const bNameStarts = bName.startsWith(lowerQuery);
    if (aNameStarts && !bNameStarts) return -1;
    if (!aNameStarts && bNameStarts) return 1;

    return 0;
  });
}
