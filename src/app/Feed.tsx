"use client";

import { useEffect, useState } from 'react';
import FeedItem from './FeedItem';
import PostForm from './PostForm';
import { selectFeed, selectLastFeed, setFeed, setLastFeed } from '@/store/prevSlice';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';

export default function Feed(props: any) {
  const token = props.token;
  const post_id = props.post_id;
  
  const router = useRouter();

  const [thread, setThread] = useState(<></> as JSX.Element);
  const [items, setItems] = useState([] as JSX.Element[]);
  const [nextMaxId, setNextMaxId] = useState(null as string | null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  const dispatch = useDispatch();
  const prevFeed = useSelector(selectFeed);
  const lastPrevFeed = useSelector(selectLastFeed);

  const handleScroll = () =>  {
    if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || isLoading) {
      return;
    }

    if (nextMaxId === null || nextMaxId === undefined) {
      return;
    }
    
    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
  
    try {
      let data = {} as any;
      if (post_id) {
        const response = await fetch('/api/post/' + post_id, {
          method: 'POST',
          body: JSON.stringify({
            token: token,
            max_id: nextMaxId
          }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
        data = await response.json();

        data.items = data.reply_threads;

        if (data.containing_thread) {
          setThread(
            <FeedItem key={data.containing_thread.id} token={token} item={data.containing_thread}/>
          )
        }
        
        setNextMaxId(data.paging_tokens.downwards);
      }
      else {
        const fetchPrevFeed = ((Date.now()/1000) - lastPrevFeed) > 60*5;

        console.log(prevFeed, fetchPrevFeed);
        if (!prevFeed || fetchPrevFeed) {
          const response = await fetch('/api/feed', {
            method: 'POST',
            body: JSON.stringify({
              token: token,
              max_id: nextMaxId
            }),
            headers: {
              'Content-Type': 'application/json'
            }
          })
          data = await response.json();

          // Main feed, set into cache.
          dispatch(setFeed(data));
          dispatch(setLastFeed(Date.now()/1000));
        }
        else {
          data = prevFeed;
        }
        
        setNextMaxId(data.next_max_id);
      }

      const newItems = [] as JSX.Element[];
      for (let item of data.items) {
        let exists = items.reduce((acc, cur) => {
          if (cur.key == item.id) return true;
          return acc;
        }, false);

        if (item.posts.length > 0 && !exists) {
          newItems.push(
            <FeedItem key={item.id} token={token} item={item}/>
          )
        }
      }
  
      setItems(prevItems => [...prevItems, ...newItems]);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const addPost = (item: any) => {
    const newPost = <FeedItem key={item.id} token={token} item={{posts: [item]}}/>
    setItems(prevItems => [newPost, ...prevItems])
  }

  const handleRefreshBtn = async (e: any) => {
    e.preventDefault();

    setItems([]);
    dispatch(setLastFeed(0));
  }
  
  useEffect(() => {
    if (lastPrevFeed === 0 && items.length === 0) {
      fetchData();
    }
  }, [lastPrevFeed])

  useEffect(() => {
    if (isFirstLoad) {
      setIsFirstLoad(false);
      fetchData();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    }
  }, [isLoading]);

  return (
    <>
      {(post_id) && 
        <div>
          {thread}
        </div>
      }
      <div>
        <PostForm token={token} addPost={addPost} post_id={post_id} />
        <hr className="border-b-gray-800" />
      </div>
      {(!post_id) &&
        <button className="text-white float-right" onClick={handleRefreshBtn}>
          <svg className="h-10 w-10 text-white mr-5 mt-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      }
      <div>
        {items}
      </div>
    </>
  )
}
