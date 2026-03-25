describe('WorkspaceAI Multi-Role Dashboard Tests', () => {
  const password = 'password123';

  beforeEach(() => {
    // Ensuring clean state if needed
  })

  it('Admin: Should access Command Center and User Operations', () => {
    cy.login('admin@company.com', password);
    cy.contains('COMMAND CENTER').should('be.visible');
    cy.contains('User Operations').click();
    cy.get('.data-table').should('exist');
  });

  it('HR: Should verify AI Predictions and Wellness Analytics', () => {
    cy.login('hr@company.com', password);
    cy.contains('Churn Prediction').click();
    cy.contains('AI Risk Score').should('be.visible');
    cy.contains('Health Analytics').click();
    cy.contains('Wellness Logs').should('be.visible');
  });

  it('Employee: Should submit Wellness AI and browse Cafeteria', () => {
    cy.login('alice@company.com', password);
    cy.contains('Wellness AI').click();
    cy.contains('Hydration').should('be.visible');
    cy.contains('Smart Cafeteria').click();
    cy.contains('Classic Burger').should('be.visible');
  });

  it('Chef: Should manage Menu and KDS Live Orders', () => {
    cy.login('chef@company.com', password);
    cy.contains('Menu Manager').click();
    cy.contains('Add Item').should('be.visible');
    cy.contains('Live Orders').click();
    cy.contains('Pending').should('be.visible');
  });
});
