@Library('jenkins-library')

def pipeline = new org.docker.AppPipeline(steps: this,
    dockerImageName:        'iroha2/iroha2-docs-compat-matrix-service',
    dockerRegistryCred:     'bot-iroha2-rw',
    dockerImageTags:        ['main': '1.0.0', 'feature/DOPS-2613-deploy-iroha2-compat-matrix': '1.0.2'])
pipeline.runPipeline()