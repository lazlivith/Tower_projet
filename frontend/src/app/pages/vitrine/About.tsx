import { Award, Users, Target, Heart } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] text-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-6 text-center">À Propos de Tower Structure</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto text-center">
            Depuis plus de 15 ans, nous accompagnons les professionnels de la construction dans leurs projets d'ingénierie structurelle
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="mb-6">Notre Histoire</h2>
              <div className="space-y-4 text-gray-700">
                <p>
                  Fondée en 2011 par une équipe d'ingénieurs passionnés, Tower Structure s'est rapidement imposée comme un acteur majeur dans le domaine de l'ingénierie structurelle en France.
                </p>
                <p>
                  Notre expertise couvre l'ensemble du cycle de vie des structures : de la conception initiale avec la modélisation BIM, aux calculs de dimensionnement selon les Eurocodes, en passant par le diagnostic et le renforcement de structures existantes.
                </p>
                <p>
                  Pionniers dans l'adoption des technologies BIM, nous avons développé une plateforme de formation en ligne pour partager notre savoir-faire avec la nouvelle génération d'ingénieurs.
                </p>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop"
                alt="Tower Structure"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Nos Valeurs</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Les principes qui guident notre travail au quotidien
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Award,
                title: 'Excellence',
                description: 'Nous visons l\'excellence dans chaque projet, respectant les plus hauts standards de qualité',
              },
              {
                icon: Users,
                title: 'Collaboration',
                description: 'Le travail d\'équipe et la communication sont au cœur de notre approche',
              },
              {
                icon: Target,
                title: 'Innovation',
                description: 'Nous adoptons les technologies les plus avancées pour optimiser nos prestations',
              },
              {
                icon: Heart,
                title: 'Engagement',
                description: 'Nous nous engageons pleinement dans la réussite de chaque projet confié',
              },
            ].map((value, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <value.icon className="w-12 h-12 mx-auto mb-4 text-[#FFC107]" />
                <h3 className="mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Notre Équipe</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Des experts passionnés à votre service
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Dr. Sophie Rousseau',
                role: 'Directrice Technique',
                image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop',
                description: 'PhD en Génie Civil, 20 ans d\'expérience',
              },
              {
                name: 'Prof. Marc Martin',
                role: 'Responsable Formation',
                image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
                description: 'Expert BIM et formateur certifié',
              },
              {
                name: 'Ing. Paul Dubois',
                role: 'Ingénieur Structure Senior',
                image: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop',
                description: 'Spécialiste Eurocodes et calculs sismiques',
              },
            ].map((member, index) => (
              <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-64 object-cover"
                />
                <div className="p-6 text-center">
                  <h3 className="mb-1">{member.name}</h3>
                  <div className="text-[#FFC107] mb-3">{member.role}</div>
                  <p className="text-gray-600">{member.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-[#F5F6FA]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="mb-4">Certifications & Accréditations</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Reconnus par les organismes professionnels majeurs
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              'ISO 9001:2015',
              'Qualiopi',
              'Ordre des Ingénieurs',
              'BuildingSMART',
            ].map((cert, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md text-center">
                <div className="w-16 h-16 bg-[#FFC107] rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Award className="w-8 h-8 text-[#1A1A2E]" />
                </div>
                <div className="font-semibold">{cert}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
