"use client";

import { useRouter, useSearchParams } from "next/navigation";

function SortBy() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    params.set("sort", e.target.value);
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="mb-4">
      <label htmlFor="sort" className="mr-2 font-semibold">
        Sort By:
      </label>
      <select
        id="sort"
        className="text-black p-2"
        value={params.get("sort") || ""}
        onChange={handleSortChange}
      >
        <option value="">Default</option>
        <option value="price_asc">Price: Low to High</option>
        <option value="price_desc">Price: High to Low</option>
        <option value="name_asc">Name: A to Z</option>
        <option value="name_desc">Name: Z to A</option>
      </select>
    </div>
  );
}

export default SortBy;
