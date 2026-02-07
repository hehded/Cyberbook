/**
 * Frontend Entry Point
 * Initializes the refactored frontend architecture
 */

import { app } from './modules/App.ts';
import { MapComponent } from './modules/MapComponent.ts';

/**
 * Initialize the frontend application
 */
function initializeFrontend(): void {
  // Templates are already loaded by waitForDOM -> loadTemplates().then(...)
  
  // Initialize components
  initializeComponents();
  
  // Mount app (bind global UI events)
  app.mount();
  
  // Start the application
  // App constructor automatically initializes itself
}

/**
 * Load HTML templates into the DOM
 */
async function loadTemplates(): Promise<void> {
  // Load main template
  try {
    const mainTemplateResponse = await fetch('../templates/main.html');
    const mainTemplate = await mainTemplateResponse.text();
    
    if (document.body) {
      document.body.innerHTML = mainTemplate;
    }
    
    // Load modal templates
    const modalTemplatesResponse = await fetch('../templates/modals.html');
    const modalTemplates = await modalTemplatesResponse.text();
    
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalTemplates;
    document.body.appendChild(modalContainer);
  } catch (error) {
    console.error('Failed to load templates:', error);
  }
}

/**
 * Initialize components
 */
function initializeComponents(): void {
  // Initialize map component
  const mapComponent = new MapComponent();
  
  // Add component to app
  app.addComponent(mapComponent);
  
  // Initialize other components here as they are created
  // const sidebarComponent = new SidebarComponent();
  // app.addComponent(sidebarComponent);
  
  // const modalComponent = new ModalComponent();
  // app.addComponent(modalComponent);
}

/**
 * Wait for DOM to be ready
 */
function waitForDOM(): void {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadTemplates().then(initializeFrontend);
    });
  } else {
    loadTemplates().then(initializeFrontend);
  }
}

// Start the application
waitForDOM();

// Export for external access
export { app, initializeFrontend };