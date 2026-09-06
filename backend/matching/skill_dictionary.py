"""Configurable skill catalog with canonical names and regex-safe matching patterns/aliases."""

# Skill mapping: Canonical Name -> List of aliases or regex patterns to match
SKILL_CATALOG = {
    # Core Languages
    'Python': ['python', 'python3', 'py'],
    'JavaScript': ['javascript', 'js', 'es6', 'ecmascript'],
    'TypeScript': ['typescript', 'ts'],
    'Java': ['java', 'core java'],
    'C++': ['c\\+\\+', 'cpp'],
    'C#': ['c#', 'c-sharp', 'dotnet', '.net'],
    'Go': ['golang', 'go lang', '\\bgo\\b'],
    'Rust': ['rust'],
    'PHP': ['php'],
    'Ruby': ['ruby', 'ruby on rails', 'rails'],
    'Swift': ['swift'],
    'Kotlin': ['kotlin'],

    # Web & Frontend Frameworks
    'React': ['react', 'react.js', 'reactjs'],
    'Next.js': ['next.js', 'nextjs'],
    'Vue.js': ['vue', 'vue.js', 'vuejs'],
    'Angular': ['angular', 'angularjs', 'angular.js'],
    'HTML': ['html', 'html5'],
    'CSS': ['css', 'css3', 'scss', 'sass', 'tailwind', 'bootstrap'],
    'Node.js': ['node', 'node.js', 'nodejs'],
    'Express': ['express', 'express.js', 'expressjs'],

    # Backend Frameworks
    'Django': ['django'],
    'Django REST Framework': ['django rest framework', 'drf', 'django rest'],
    'FastAPI': ['fastapi', 'fast api'],
    'Flask': ['flask'],
    'Spring Boot': ['spring boot', 'spring framework', 'spring'],
    'ASP.NET': ['asp.net', 'asp.net core', '.net core'],

    # APIs & Architecture
    'REST API': ['rest', 'rest api', 'restful', 'restful api', 'rest apis'],
    'GraphQL': ['graphql'],
    'Microservices': ['microservices', 'micro-services', 'microservice'],
    'OOP': ['oop', 'object-oriented programming', 'object oriented programming'],
    'Data Structures': ['data structures', 'dsa'],
    'Algorithms': ['algorithms', 'algorithm design'],

    # Databases
    'SQL': ['sql'],
    'PostgreSQL': ['postgres', 'postgresql', 'psql'],
    'MySQL': ['mysql'],
    'MongoDB': ['mongodb', 'mongo'],
    'Redis': ['redis'],
    'SQLite': ['sqlite', 'sqlite3'],
    'Oracle DB': ['oracle db', 'oracle database'],

    # Cloud & DevOps
    'Docker': ['docker', 'containerization', 'containers'],
    'Kubernetes': ['kubernetes', 'k8s'],
    'AWS': ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
    'Azure': ['azure', 'microsoft azure'],
    'GCP': ['gcp', 'google cloud', 'google cloud platform'],
    'Git': ['git'],
    'GitHub': ['github'],
    'CI/CD': ['ci/cd', 'cicd', 'continuous integration', 'github actions', 'jenkins', 'gitlab ci'],
    'Linux': ['linux', 'unix', 'ubuntu', 'bash', 'shell scripting'],

    # Data Science & Machine Learning
    'Machine Learning': ['machine learning', 'ml', 'deep learning'],
    'TensorFlow': ['tensorflow', 'tf'],
    'PyTorch': ['pytorch'],
    'Pandas': ['pandas'],
    'NumPy': ['numpy'],
    'Scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn'],
}
