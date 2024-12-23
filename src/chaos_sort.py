import random

def chaos_sort(arr):
    # get min and max of the array
    min_val, max_val = min(arr), max(arr)
    
    while True:
        changes_made = False
        i = 0
        while i < len(arr) - 1:
            if arr[i] > arr[i + 1]:
                # remove the element at i+1 and insert a random number between min and max at a random index
                random_number = random.randint(min_val, max_val)
                random_index = random.randint(0, len(arr))  # random index to insert the number
                arr.insert(random_index, random_number)
                del arr[i + 1]  # remove the smaller element
                changes_made = True
            else:
                i += 1
        
        if not changes_made:
            break
    
    return arr

# example
arr = [5, 3, 2, 1, 7, 8]
sorted_arr = chaos_sort(arr)
print("Sorted array:", sorted_arr)
