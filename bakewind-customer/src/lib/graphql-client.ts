import { GraphQLClient } from 'graphql-request';

const endpoint = 'https://rickandmortyapi.com/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
  // Add headers here if needed (e.g., authentication)
  headers: {
    // 'Authorization': 'Bearer YOUR_TOKEN',
  },
});

// Type definitions for Rick & Morty API (as an example)
export interface Character {
  id: string;
  name: string;
  status: string;
  species: string;
  image: string;
  episode: {
    name: string;
  }[];
}

export interface CharactersResponse {
  characters: {
    results: Character[];
    info: {
      count: number;
      pages: number;
      next: number | null;
      prev: number | null;
    };
  };
}