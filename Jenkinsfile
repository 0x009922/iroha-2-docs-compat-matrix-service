@Library('jenkins-library')

def pipeline = new org.docker.AppPipeline(steps: this,
    dockerImageName:        'iroha2/iroha2-docs-compat-matrix-service',
    dockerRegistryCred:     'bot-iroha2-rw',
    dockerImageTags:        ['main': 'latest', 'develop': 'dev'])
pipeline.runPipeline()