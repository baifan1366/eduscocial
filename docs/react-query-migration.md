# React Query Migration Guide

This document provides guidance on the ongoing migration from raw fetch calls to React Query in our application.

## Implemented Features

### 1. API Client Configuration

The base API client is configured in `lib/api.js` with the following features:
- Standardized error handling with custom `ApiError` class
- Request/response interceptors for authentication and logging
- Timeout handling with AbortController
- Consistent method helpers (get, post, put, patch, delete)

### 2. Domain-Specific API Endpoints

API endpoints are organized by domain in `lib/api.js`:
- `postsApi`: Functions for post CRUD operations
- `authApi`: Authentication-related functions
- `usersApi`: User profile and management functions
- `commentsApi`: Comment CRUD operations
- `searchApi`: Search functionality
- `boardsApi`: Board management
- `recommendApi`: Recommendation system functions
- `filesApi`: File upload and management

All these domains are exported as a single `api` object for easy access.

### 3. Query Key Management

Query keys are managed in `lib/queryKeys.js` with a hierarchical structure:
- Domain-specific keys (posts, users, auth, etc.)
- Nested key generators for lists, details, etc.
- Consistent pattern for cache invalidation

### 4. React Query Hooks

#### Query Hooks (Data Fetching)

- `useGetPosts`: Fetch posts with pagination and filtering
- `useGetPost`: Fetch a single post by ID
- `useGetUserProfile`: Fetch user profile data

#### Mutation Hooks (Data Modification)

- `useCreatePost`: Create a new post with cache invalidation
- `useUpdatePost`: Update an existing post with cache updates
- `useDeletePost`: Delete a post and update cache
- `useLogin`: User login with cache management
- `useLogout`: User logout with cache clearing

## Migration Guide

### How to Migrate Components

1. **Replace Direct API Calls**

   Before:
   ```javascript
   const [posts, setPosts] = useState([]);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState(null);
   
   useEffect(() => {
     const fetchPosts = async () => {
       try {
         setLoading(true);
         const response = await fetch('/api/posts');
         const data = await response.json();
         setPosts(data);
       } catch (error) {
         setError(error);
       } finally {
         setLoading(false);
       }
     };
     
     fetchPosts();
   }, []);
   ```

   After:
   ```javascript
   import useGetPosts from '@/hooks/useGetPosts';
   
   const { data: posts, isLoading, error } = useGetPosts();
   ```

2. **Replace Form Submissions**

   Before:
   ```javascript
   const [submitting, setSubmitting] = useState(false);
   const [error, setError] = useState(null);
   
   const handleSubmit = async (formData) => {
     try {
       setSubmitting(true);
       const response = await fetch('/api/posts/publish', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(formData)
       });
       const data = await response.json();
       router.push(`/posts/${data.id}`);
     } catch (error) {
       setError(error);
     } finally {
       setSubmitting(false);
     }
   };
   ```

   After:
   ```javascript
   import useCreatePost from '@/hooks/useCreatePost';
   
   const { mutate: createPost, isPending, error } = useCreatePost({
     onSuccess: (data) => {
       router.push(`/posts/${data.id}`);
     }
   });
   
   const handleSubmit = (formData) => {
     createPost(formData);
   };
   ```

3. **Using Loading States**

   ```jsx
   import useGetPosts from '@/hooks/useGetPosts';
   
   const PostsList = () => {
     const { data, isLoading, error } = useGetPosts();
     
     if (isLoading) return <LoadingSkeleton />;
     if (error) return <ErrorDisplay error={error} />;
     
     return (
       <div>
         {data.map(post => (
           <PostCard key={post.id} post={post} />
         ))}
       </div>
     );
   };
   ```

### Best Practices

1. **Use Query Options**
   - Customize stale time for data that doesn't change frequently
   - Set appropriate retry counts for critical operations
   - Use `enabled` flag to conditionally fetch data

2. **Cache Management**
   - Invalidate related queries when data changes
   - Use query client for optimistic updates
   - Prefetch data for improved user experience

3. **Error Handling**
   - Implement error boundaries for React Query errors
   - Display user-friendly error messages
   - Add retry mechanisms for transient errors

## Next Steps

- Migrate existing components to use React Query hooks
- Implement optimistic updates for better UX
- Add comprehensive error handling and fallback UI
- Set up testing for React Query hooks
- Optimize performance with prefetching and deduplication

## References

- [TanStack Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Query Keys](https://tanstack.com/query/latest/docs/react/guides/query-keys)
- [React Query Mutations](https://tanstack.com/query/latest/docs/react/guides/mutations) 