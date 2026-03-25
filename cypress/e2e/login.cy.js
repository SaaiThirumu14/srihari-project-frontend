describe('WorkspaceAI Authentication', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should display the login page correctly', () => {
    cy.get('h1').should('contain', 'WELCOME BACK')
    cy.get('input[type="email"]').should('be.visible')
    cy.get('input[type="password"]').should('be.visible')
  })

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('wrong@example.com')
    cy.get('input[type="password"]').type('wrongpassword')
    cy.get('button').contains('Log In').click()
    cy.contains('Invalid credentials').should('be.visible')
  })

  it('should allow Admin to login and see dashboard', () => {
    // Note: This requires the seed data to be present (admin@example.com / password123)
    cy.get('input[type="email"]').type('admin@example.com')
    cy.get('input[type="password"]').type('password123')
    cy.get('button').contains('Log In').click()
    
    // Check if redirected to dashboard
    cy.url().should('include', '/dashboard')
    cy.contains('Admin Dashboard').should('be.visible')
  })
})
