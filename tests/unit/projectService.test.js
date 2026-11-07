const ProjectService = require('../../src/services/projectService');
const pool = require('../../src/config/database');

describe('ProjectService Unit Tests', () => {
  let createdProjectId = null;
  const testUserId = 1; // Admin user from seeds

  afterAll(async () => {
    if (createdProjectId) {
      await pool.query('DELETE FROM projects WHERE id = ?', [createdProjectId]);
    }
  });

  it('createProject() debe insertar y retornar el nuevo proyecto', async () => {
    const project = await ProjectService.createProject({
      userId: testUserId,
      name: 'Embudo Unitario Test',
      description: 'Descripción para prueba unitaria',
      color: '#FF5733',
      isPublic: false
    });

    expect(project).toBeDefined();
    expect(project.id).toBeDefined();
    expect(project.name).toBe('Embudo Unitario Test');
    expect(project.color).toBe('#FF5733');
    expect(project.user_id).toBe(testUserId);

    createdProjectId = project.id;
  });

  it('getUserProjects() debe listar proyectos y paginar correctamente', async () => {
    const result = await ProjectService.getUserProjects({
      userId: testUserId,
      role: 'editor',
      page: 1,
      limit: 10
    });

    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.pagination).toBeDefined();
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);
    expect(result.pagination.total).toBeGreaterThan(0);
  });
});
