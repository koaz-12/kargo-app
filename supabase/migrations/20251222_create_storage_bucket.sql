-- Create the bucket if it doesn't exist
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Set policy to allow public access
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- Set policy to allow authenticated uploads (allow all for dev)
create policy "Authenticated Uploads"
on storage.objects for insert
with check ( bucket_id = 'product-images' );

-- Set policy to allow authenticated deletes
create policy "Authenticated Deletes"
on storage.objects for delete
using ( bucket_id = 'product-images' );
