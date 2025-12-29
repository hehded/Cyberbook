/**
 * LoginComponent Tests
 * Tests for LoginComponent implementation
 */

import { assertEquals, assertExists, assertThrows } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { LoginComponent } from "../../../src/frontend/components/LoginComponent.ts";

// Mock DOM elements for testing
function createMockDOM() {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  
  const modalElement = document.createElement('div');
  modalElement.id = 'loginModal';
  modalElement.style.display = 'none';
  container.appendChild(modalElement);
  
  return container;
}

// Clean up DOM after tests
function cleanupDOM() {
  const container = document.getElementById('test-container');
  if (container) {
    document.body.removeChild(container);
  }
}

Deno.test("LoginComponent should initialize with default config", () => {
  createMockDOM();
  
  try {
    const component = new LoginComponent();
    assertExists(component);
    assertEquals(typeof component.show, 'function');
    assertEquals(typeof component.hide, 'function');
  } finally {
    cleanupDOM();
  }
});

Deno.test("LoginComponent should show and hide correctly", () => {
  createMockDOM();
  
  try {
    const component = new LoginComponent();
    
    // Initially hidden
    const modalElement = document.getElementById('loginModal');
    assertEquals(modalElement?.style.display, 'none');
    
    // Show component
    component.show();
    assertEquals(modalElement?.style.display, 'flex');
    
    // Hide component
    component.hide();
    assertEquals(modalElement?.style.display, 'none');
  } finally {
    cleanupDOM();
  }
});

Deno.test("LoginComponent should validate form inputs", () => {
  createMockDOM();
  
  try {
    const component = new LoginComponent();
    component.show();
    
    // Get form inputs
    const loginInput = document.getElementById('loginInput') as HTMLInputElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    
    assertExists(loginInput);
    assertExists(passwordInput);
    
    // Test empty inputs validation
    loginInput.value = '';
    passwordInput.value = '';
    
    // Submit form (trigger validation)
    const form = document.getElementById('loginForm') as HTMLFormElement;
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      (form as any).dispatchEvent(event);
    }
    
    // Check for error message
    const errorElement = document.getElementById('loginError') as HTMLElement;
    assertExists(errorElement);
  } finally {
    cleanupDOM();
  }
});

Deno.test("LoginComponent should clear error on input", () => {
  createMockDOM();
  
  try {
    const component = new LoginComponent();
    component.show();
    
    // Get form inputs
    const loginInput = document.getElementById('loginInput') as HTMLInputElement;
    const errorElement = document.getElementById('loginError') as HTMLElement;
    
    assertExists(loginInput);
    assertExists(errorElement);
    
    // Manually set error
    errorElement.textContent = 'Test error';
    errorElement.style.display = 'block';
    assertEquals(errorElement.textContent, 'Test error');
    assertEquals(errorElement.style.display, 'block');
    
    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    (loginInput as any).dispatchEvent(inputEvent);
    
    // Error should be cleared
    assertEquals(errorElement.textContent, '');
    assertEquals(errorElement.style.display, 'none');
  } finally {
    cleanupDOM();
  }
});

Deno.test("LoginComponent should handle close button click", () => {
  createMockDOM();
  
  try {
    const component = new LoginComponent();
    component.show();
    
    // Get close button
    const closeBtn = document.getElementById('closeLoginModal') as HTMLButtonElement;
    assertExists(closeBtn);
    
    // Click close button
    const clickEvent = new Event('click', { bubbles: true });
    (closeBtn as any).dispatchEvent(clickEvent);
    
    // Component should be hidden
    const modalElement = document.getElementById('loginModal');
    assertEquals(modalElement?.style.display, 'none');
  } finally {
    cleanupDOM();
  }
});

Deno.test("LoginComponent should reset form when shown", () => {
  createMockDOM();
  
  try {
    const component = new LoginComponent();
    component.show();
    
    // Get form inputs
    const loginInput = document.getElementById('loginInput') as HTMLInputElement;
    const passwordInput = document.getElementById('passwordInput') as HTMLInputElement;
    
    assertExists(loginInput);
    assertExists(passwordInput);
    
    // Set values
    loginInput.value = 'testuser';
    passwordInput.value = 'testpass';
    
    // Hide and show again
    component.hide();
    component.show();
    
    // Values should be reset
    assertEquals(loginInput.value, '');
    assertEquals(passwordInput.value, '');
  } finally {
    cleanupDOM();
  }
});