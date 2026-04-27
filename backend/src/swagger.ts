// OpenAPI 3.0 specification for the Confix backend API.
// Mounted at /api-docs via swagger-ui-express in src/index.ts.

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Confix Backend API',
    version: '1.0.0',
    description:
      'REST API for Confix — infrastructure incident reporting, risk assessment, and field-engineer workflow.',
  },
  servers: [
    { url: 'https://confix-jocy.onrender.com', description: 'Production (Render)' },
    { url: 'http://localhost:5000', description: 'Local development' },
  ],
  tags: [
    { name: 'Health', description: 'Liveness / readiness probes' },
    { name: 'Auth', description: 'Login, current user, password change' },
    { name: 'Users', description: 'Worker and admin management' },
    { name: 'Companies', description: 'Company registration, approval, assets' },
    { name: 'Reports', description: 'Incident report CRUD and workflow' },
    { name: 'Threads', description: 'Per-report message threads & resolution' },
    { name: 'Notifications', description: 'In-app notifications & nearest-worker dispatch' },
    { name: 'Stats', description: 'Aggregated dashboard statistics' },
    { name: 'Assistant', description: 'Mock AI suggestion helper' },
    { name: 'Voice Report', description: 'Audio → transcript → structured report (Whisper + LLM)' },
    { name: 'Analyze Image', description: 'Vision AI inspection analysis with EXIF extraction' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description:
          'Custom token in the form `userId:role:companyId`. Returned by `POST /api/auth/login`.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: { error: { type: 'string' } },
      },
      Message: {
        type: 'object',
        properties: { message: { type: 'string' } },
      },
      LoginRequest: {
        type: 'object',
        required: ['identifier', 'password'],
        properties: {
          identifier: {
            type: 'string',
            description: 'Email (admin/superadmin) or 5-digit worker ID',
            example: '12345',
          },
          password: { type: 'string', example: 'secret123' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          token: { type: 'string', example: 'uuid:worker:company-uuid' },
          user: { $ref: '#/components/schemas/User' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          role: { type: 'string', enum: ['superadmin', 'admin', 'worker'] },
          full_name: { type: 'string' },
          email: { type: 'string', nullable: true },
          worker_id: { type: 'string', nullable: true, example: '12345' },
          company_id: { type: 'string', format: 'uuid', nullable: true },
          position: { type: 'string', nullable: true },
          team: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['active', 'inactive'], nullable: true },
          worker_type: { type: 'string', enum: ['audit', 'field'], nullable: true },
          workplace_latitude: { type: 'number', nullable: true },
          workplace_longitude: { type: 'number', nullable: true },
          workplace_address: { type: 'string', nullable: true },
        },
      },
      ChangePasswordRequest: {
        type: 'object',
        required: ['currentPassword', 'newPassword'],
        properties: {
          currentPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      CreateWorkerRequest: {
        type: 'object',
        required: ['full_name', 'position', 'password', 'worker_id'],
        properties: {
          full_name: { type: 'string' },
          position: { type: 'string' },
          team: { type: 'string', nullable: true },
          password: { type: 'string', minLength: 6 },
          worker_id: { type: 'string', pattern: '^\\d{5}$', example: '12345' },
          phone: { type: 'string', nullable: true },
          email: { type: 'string', nullable: true },
          workplace_latitude: { type: 'number', nullable: true },
          workplace_longitude: { type: 'number', nullable: true },
          workplace_address: { type: 'string', nullable: true },
          worker_type: { type: 'string', enum: ['audit', 'field'], default: 'field' },
          company_id: { type: 'string', format: 'uuid', nullable: true, description: 'superadmin only' },
        },
      },
      UpdateWorkerRequest: {
        type: 'object',
        properties: {
          full_name: { type: 'string' },
          position: { type: 'string' },
          team: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          assigned_asset_id: { type: 'string', format: 'uuid', nullable: true },
          workplace_latitude: { type: 'number' },
          workplace_longitude: { type: 'number' },
          workplace_address: { type: 'string' },
          worker_type: { type: 'string', enum: ['audit', 'field'], nullable: true },
        },
      },
      CreateAdminRequest: {
        type: 'object',
        required: ['full_name', 'email', 'password', 'company_id'],
        properties: {
          full_name: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
          company_id: { type: 'string', format: 'uuid' },
          phone: { type: 'string', nullable: true },
        },
      },
      ResetPasswordRequest: {
        type: 'object',
        required: ['password'],
        properties: { password: { type: 'string', minLength: 6 } },
      },
      Company: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          slug: { type: 'string' },
          status: { type: 'string', enum: ['active', 'inactive'] },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CompanyRegistrationRequest: {
        type: 'object',
        required: ['company_name', 'contact_email', 'admin_name'],
        properties: {
          company_name: { type: 'string' },
          contact_email: { type: 'string', format: 'email' },
          contact_phone: { type: 'string', nullable: true },
          admin_name: { type: 'string' },
          admin_email: { type: 'string', format: 'email', nullable: true },
        },
      },
      CompanyRegistration: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          company_name: { type: 'string' },
          contact_email: { type: 'string' },
          contact_phone: { type: 'string', nullable: true },
          admin_name: { type: 'string' },
          admin_email: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
          rejection_reason: { type: 'string', nullable: true },
          reviewed_by: { type: 'string', format: 'uuid', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      ApproveRegistrationRequest: {
        type: 'object',
        required: ['admin_password'],
        properties: { admin_password: { type: 'string', minLength: 6 } },
      },
      RejectRegistrationRequest: {
        type: 'object',
        properties: { rejection_reason: { type: 'string' } },
      },
      Asset: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          company_id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          type: { type: 'string' },
          location_name: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          assigned_worker_id: { type: 'string', format: 'uuid', nullable: true },
          status: { type: 'string', nullable: true },
        },
      },
      CreateAssetRequest: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          location_name: { type: 'string', nullable: true },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          assigned_worker_id: { type: 'string', format: 'uuid', nullable: true },
        },
      },
      Report: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          tenant_id: { type: 'string' },
          company_id: { type: 'string', format: 'uuid', nullable: true },
          company_name: { type: 'string', nullable: true },
          asset_id: { type: 'string', format: 'uuid', nullable: true },
          asset_name: { type: 'string' },
          asset_type: { type: 'string' },
          location_name: { type: 'string' },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          issue_type: { type: 'string' },
          description: { type: 'string' },
          image_name: { type: 'string', nullable: true },
          status: {
            type: 'string',
            enum: ['New', 'Reviewed', 'Assigned', 'In Progress', 'Resolved', 'Verified', 'resolved', 'in_progress'],
          },
          impact: { type: 'integer', minimum: 1, maximum: 5 },
          likelihood: { type: 'integer', minimum: 1, maximum: 5 },
          risk_matrix_score: { type: 'integer' },
          risk_level: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          created_by: { type: 'string' },
          worker_id: { type: 'string', format: 'uuid' },
          assigned_worker_id: { type: 'string', format: 'uuid', nullable: true },
          assigned_team: { type: 'string', nullable: true },
          supervisor_reviewed: { type: 'boolean' },
          recommended_action: { type: 'string' },
          ai_suggestion: { type: 'string', nullable: true },
          required_ppe: { type: 'array', items: { type: 'string' } },
          safety_instructions: { type: 'array', items: { type: 'string' } },
          worker_safety_level: { type: 'string' },
          minimum_crew: { type: 'integer' },
          supervisor_approval_required: { type: 'boolean' },
          hazard_radius_meters: { type: 'integer' },
          safety_checklist_completed: { type: 'boolean' },
          visibility_level: { type: 'string', enum: ['Internal', 'Critical', 'Public'] },
          exact_coordinates_restricted: { type: 'boolean' },
          audit_trail: { type: 'array', items: { type: 'object' } },
          resolution_notes: { type: 'string', nullable: true },
          resolved_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateReportRequest: {
        type: 'object',
        required: ['assetName', 'assetType', 'locationName', 'issueType', 'description', 'impact', 'likelihood'],
        properties: {
          assetId: { type: 'string', format: 'uuid', nullable: true },
          assetName: { type: 'string' },
          assetType: { type: 'string' },
          locationName: { type: 'string' },
          latitude: { type: 'number', nullable: true },
          longitude: { type: 'number', nullable: true },
          issueType: { type: 'string' },
          description: { type: 'string' },
          imageName: { type: 'string', nullable: true },
          impact: { type: 'integer', minimum: 1, maximum: 5 },
          likelihood: { type: 'integer', minimum: 1, maximum: 5 },
          visibilityLevel: { type: 'string', enum: ['Internal', 'Critical', 'Public'] },
        },
      },
      UpdateStatusRequest: {
        type: 'object',
        required: ['status'],
        properties: { status: { type: 'string' } },
      },
      SafetyChecklistRequest: {
        type: 'object',
        required: ['completed'],
        properties: { completed: { type: 'boolean' } },
      },
      ReportMessage: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          report_id: { type: 'string', format: 'uuid' },
          sender_id: { type: 'string', format: 'uuid' },
          sender_role: { type: 'string' },
          body: { type: 'string' },
          attachment_url: { type: 'string', nullable: true },
          is_system: { type: 'boolean' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateMessageRequest: {
        type: 'object',
        required: ['body'],
        properties: {
          body: { type: 'string' },
          attachment_url: { type: 'string', nullable: true },
        },
      },
      ResolveThreadRequest: {
        type: 'object',
        properties: { resolution_notes: { type: 'string' } },
      },
      Notification: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          recipient_id: { type: 'string', format: 'uuid' },
          sender_id: { type: 'string', format: 'uuid', nullable: true },
          report_id: { type: 'string', format: 'uuid', nullable: true },
          type: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          distance_meters: { type: 'number', nullable: true },
          read_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      NotifyNearestRequest: {
        type: 'object',
        required: ['report_id'],
        properties: {
          report_id: { type: 'string', format: 'uuid' },
          message: { type: 'string', nullable: true },
        },
      },
      AssistantRequest: {
        type: 'object',
        required: ['assetType', 'description'],
        properties: {
          assetType: { type: 'string' },
          description: { type: 'string' },
          imageName: { type: 'string', nullable: true },
        },
      },
      AssistantResponse: {
        type: 'object',
        properties: {
          suggestedIssueType: { type: 'string' },
          suggestedImpact: { type: 'integer' },
          suggestedLikelihood: { type: 'integer' },
          rationale: { type: 'string' },
          disclaimer: { type: 'string' },
        },
      },
      VoiceParseRequest: {
        type: 'object',
        required: ['transcript'],
        properties: {
          transcript: { type: 'string' },
          lang: { type: 'string', enum: ['en-US', 'ru-RU', 'az-AZ'], default: 'en-US' },
        },
      },
      VoiceParseResponse: {
        type: 'object',
        properties: {
          problem_type: { type: 'string' },
          problem: { type: 'string' },
          description: { type: 'string' },
          corrected_transcript: { type: 'string' },
          raw_transcript: { type: 'string', nullable: true },
          provider: { type: 'string' },
        },
      },
      AnalyzeImageResponse: {
        type: 'object',
        properties: {
          metadata: {
            type: 'object',
            properties: {
              confidence_score: { type: 'number' },
              environment: { type: 'string' },
            },
          },
          asset: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              identified_id: { type: 'string', nullable: true },
            },
          },
          diagnostics: {
            type: 'object',
            properties: {
              is_defective: { type: 'boolean' },
              defect_type: { type: 'string', nullable: true },
              severity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
              technical_description: { type: 'string' },
            },
          },
          spatial_context: {
            type: 'object',
            properties: {
              extracted_text: { type: 'array', items: { type: 'string' } },
              visual_location_markers: { type: 'string' },
            },
          },
          exif: {
            type: 'object',
            properties: {
              latitude: { type: 'number', nullable: true },
              longitude: { type: 'number', nullable: true },
              date_taken: { type: 'string', nullable: true },
              location_source: { type: 'string', enum: ['exif', 'none'] },
            },
          },
          _provider: { type: 'string' },
        },
      },
      Stats: {
        type: 'object',
        properties: {
          totalReports: { type: 'integer' },
          criticalReports: { type: 'integer' },
          highRiskReports: { type: 'integer' },
          pendingMaintenance: { type: 'integer' },
          activeHazardZones: { type: 'integer' },
          safetyChecklistsPending: { type: 'integer' },
          supervisorReviewsPending: { type: 'integer' },
          averageRiskMatrixScore: { type: 'number' },
          riskDistribution: { type: 'array', items: { type: 'object' } },
          assetTypeBreakdown: { type: 'array', items: { type: 'object' } },
          statusDistribution: { type: 'array', items: { type: 'object' } },
          reportsByCompany: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid auth token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      Forbidden: {
        description: 'Insufficient role / tenant access',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      BadRequest: {
        description: 'Validation error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
    },
  },
  paths: {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/ping': {
      get: {
        tags: ['Health'],
        summary: 'Ping (keep-alive)',
        responses: {
          200: {
            description: 'pong',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'pong' },
                    timestamp: { type: 'string', format: 'date-time' },
                    uptime_seconds: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Auth ──
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login with email or 5-digit worker ID',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current user + company + assigned assets',
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { $ref: '#/components/schemas/User' },
                    company: { $ref: '#/components/schemas/Company' },
                    assignedAssets: { type: 'array', items: { $ref: '#/components/schemas/Asset' } },
                  },
                },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
    '/api/auth/change-password': {
      post: {
        tags: ['Auth'],
        summary: 'Change own password',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ChangePasswordRequest' } } },
        },
        responses: {
          200: { description: 'Password updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },

    // ── Users ──
    '/api/users/workers': {
      get: {
        tags: ['Users'],
        summary: 'List workers (admin: own company; superadmin: all)',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } } },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create worker (admin/superadmin)',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateWorkerRequest' } } } },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { description: 'Worker ID already exists' },
        },
      },
    },
    '/api/users/workers/{id}': {
      patch: {
        tags: ['Users'],
        summary: 'Update worker',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateWorkerRequest' } } } },
        responses: {
          200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete worker',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'Deleted', content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } } },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/users/workers/{id}/password': {
      post: {
        tags: ['Users'],
        summary: 'Reset worker password',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } } },
        responses: {
          200: { description: 'Password updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Message' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/users/admins': {
      get: {
        tags: ['Users'],
        summary: 'List admins (superadmin only)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' }, 403: { $ref: '#/components/responses/Forbidden' } },
      },
      post: {
        tags: ['Users'],
        summary: 'Create admin (superadmin only)',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAdminRequest' } } } },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/api/users/admins/{id}': {
      delete: {
        tags: ['Users'],
        summary: 'Delete admin (superadmin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Deleted' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/users/admins/{id}/password': {
      post: {
        tags: ['Users'],
        summary: 'Reset admin password (superadmin only)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResetPasswordRequest' } } } },
        responses: { 200: { description: 'Password updated' } },
      },
    },

    // ── Companies ──
    '/api/companies/register': {
      post: {
        tags: ['Companies'],
        summary: 'Public company registration',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CompanyRegistrationRequest' } } } },
        responses: {
          201: {
            description: 'Submitted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string' },
                    registration: { $ref: '#/components/schemas/CompanyRegistration' },
                  },
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/api/companies/registrations': {
      get: {
        tags: ['Companies'],
        summary: 'List registrations (superadmin)',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/CompanyRegistration' } } } } },
        },
      },
    },
    '/api/companies/registrations/{id}/approve': {
      patch: {
        tags: ['Companies'],
        summary: 'Approve registration & create company + admin',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ApproveRegistrationRequest' } } } },
        responses: { 200: { description: 'Approved' }, 400: { $ref: '#/components/responses/BadRequest' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/companies/registrations/{id}/reject': {
      patch: {
        tags: ['Companies'],
        summary: 'Reject registration',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: false, content: { 'application/json': { schema: { $ref: '#/components/schemas/RejectRegistrationRequest' } } } },
        responses: { 200: { description: 'Rejected' }, 404: { $ref: '#/components/responses/NotFound' } },
      },
    },
    '/api/companies': {
      get: {
        tags: ['Companies'],
        summary: 'List companies (superadmin: all; admin: own)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Company' } } } } } },
      },
    },
    '/api/companies/{id}/assets': {
      get: {
        tags: ['Companies'],
        summary: 'List assets for a company',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Asset' } } } } } },
      },
      post: {
        tags: ['Companies'],
        summary: 'Create asset for company',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateAssetRequest' } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Asset' } } } } },
      },
    },

    // ── Reports ──
    '/api/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List reports (filterable)',
        description:
          'Anonymous access returns global view; authenticated requests apply tenant scope. Workers see only their own reports.',
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'riskLevel', in: 'query', schema: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] } },
          { name: 'assetType', in: 'query', schema: { type: 'string' } },
          { name: 'issueType', in: 'query', schema: { type: 'string' } },
          { name: 'visibilityLevel', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Free text — matches asset_name, location_name, description, issue_type' },
        ],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Report' } } } } } },
      },
      post: {
        tags: ['Reports'],
        summary: 'Create incident report',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateReportRequest' } } } },
        responses: {
          201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get one report',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/reports/{id}/status': {
      patch: {
        tags: ['Reports'],
        summary: 'Update report status',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateStatusRequest' } } } },
        responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } } } },
      },
    },
    '/api/reports/{id}/safety-checklist': {
      patch: {
        tags: ['Reports'],
        summary: 'Toggle safety checklist completion',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/SafetyChecklistRequest' } } } },
        responses: { 200: { description: 'Updated', content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } } } },
      },
    },
    '/api/reports/{id}/emergency-alert': {
      post: {
        tags: ['Reports'],
        summary: 'Trigger emergency alert to supervisor',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Alert sent' } },
      },
    },

    // ── Threads ──
    '/api/threads': {
      get: {
        tags: ['Threads'],
        summary: 'List threads visible to current user',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/api/threads/{reportId}/messages': {
      get: {
        tags: ['Threads'],
        summary: 'List messages in a report thread',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/ReportMessage' } } } } },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
      post: {
        tags: ['Threads'],
        summary: 'Post a message to a report thread',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateMessageRequest' } } } },
        responses: { 201: { description: 'Created', content: { 'application/json': { schema: { $ref: '#/components/schemas/ReportMessage' } } } } },
      },
    },
    '/api/threads/{reportId}/resolve': {
      patch: {
        tags: ['Threads'],
        summary: 'Mark thread/report as resolved',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: { required: false, content: { 'application/json': { schema: { $ref: '#/components/schemas/ResolveThreadRequest' } } } },
        responses: { 200: { description: 'Resolved', content: { 'application/json': { schema: { $ref: '#/components/schemas/Report' } } } } },
      },
    },
    '/api/threads/{reportId}/reopen': {
      patch: {
        tags: ['Threads'],
        summary: 'Reopen a resolved thread',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'Reopened' } },
      },
    },
    '/api/threads/{reportId}/ai-suggestion': {
      get: {
        tags: ['Threads'],
        summary: 'AI suggestion based on resolved similar reports',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'reportId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: {
          200: {
            description: 'Suggestion (or none)',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    has_suggestion: { type: 'boolean' },
                    suggestion: { type: 'string' },
                    success_count: { type: 'integer' },
                    total_history: { type: 'integer' },
                    asset_type: { type: 'string' },
                    issue_type: { type: 'string' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },

    // ── Notifications ──
    '/api/notifications/me': {
      get: {
        tags: ['Notifications'],
        summary: 'List my notifications (latest 100)',
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Notification' } } } } } },
      },
    },
    '/api/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ BearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Notification' } } } } },
      },
    },
    '/api/notifications/notify-nearest': {
      post: {
        tags: ['Notifications'],
        summary: 'Dispatch incident to the nearest field worker',
        security: [{ BearerAuth: [] }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/NotifyNearestRequest' } } } },
        responses: {
          201: {
            description: 'Notified',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    notification: { $ref: '#/components/schemas/Notification' },
                    worker: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        full_name: { type: 'string' },
                        distance_meters: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── Stats ──
    '/api/stats': {
      get: {
        tags: ['Stats'],
        summary: 'Aggregated statistics across reports',
        responses: { 200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/Stats' } } } } },
      },
    },

    // ── Assistant ──
    '/api/assistant': {
      post: {
        tags: ['Assistant'],
        summary: 'Mock AI suggestion for report fields',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AssistantRequest' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AssistantResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },

    // ── Voice Report ──
    '/api/voice-report/transcribe-and-parse': {
      post: {
        tags: ['Voice Report'],
        summary: 'Upload audio → Whisper transcription → LLM-structured report fields',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio'],
                properties: {
                  audio: { type: 'string', format: 'binary' },
                  lang: { type: 'string', enum: ['en-US', 'ru-RU', 'az-AZ'], default: 'en-US' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/VoiceParseResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          422: { description: 'No speech detected or AI parse failure' },
          502: { description: 'Upstream AI provider error' },
        },
      },
    },
    '/api/voice-report/parse': {
      post: {
        tags: ['Voice Report'],
        summary: 'Parse a text transcript into report fields (Groq → OpenRouter fallback)',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/VoiceParseRequest' } } } },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/VoiceParseResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          422: { description: 'AI parse failure' },
          502: { description: 'Upstream AI provider error' },
        },
      },
    },

    // ── Analyze Image ──
    '/api/analyze-image': {
      post: {
        tags: ['Analyze Image'],
        summary: 'Vision AI inspection analysis (with EXIF GPS extraction)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['image'],
                properties: {
                  image: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/AnalyzeImageResponse' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          422: { description: 'Failed to parse vision AI response' },
          502: { description: 'All vision AI providers failed' },
        },
      },
    },
  },
};
