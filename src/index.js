import { isValidDateValue } from "@testing-library/user-event/dist/utils";
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Stage, Layer, Image, Rect, Group, Text } from "react-konva";
import useImage from 'use-image';
import Konva from 'konva';

const MAX_IMAGE_HEIGHT = 700;
const MAX_IMAGE_WIDTH = 1200;

const cropImage = async (imageRef, x, y, width, height) => {
    const dataURL = imageRef.current.toDataURL({
        pixelRatio: 3,
        x: x, // Tọa độ x của vùng cắt
        y: y, // Tọa độ y của vùng cắt
        width: width, // Chiều rộng của vùng cắt
        height: height, // Chiều cao của vùng cắt
    });

    // // Gửi dữ liệu ảnh đã cắt đến API
    // const response = await fetch('your-api-url', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ image: dataURL }),
    // });

    // const result = await response.json();
    const label = 'test';
    console.log(dataURL);
    await sleep(2000).then(() => {
        console.log('End');
    });

    return label;
};

const LoadImage = ({ src, imageWidth, imageHeight, setImageWidth, setImageHeight, ratioWidth, ratioHeight, imageRef }) => {
    const [image] = useImage(src);
    useEffect(() => {
        if (image?.complete) {
            const width = image.naturalWidth;
            const height = image.naturalHeight;

            if (width > height && width > MAX_IMAGE_WIDTH) {
                setImageWidth(MAX_IMAGE_WIDTH);
                setImageHeight(height * (MAX_IMAGE_WIDTH / width))
                ratioHeight(MAX_IMAGE_WIDTH / width)
                ratioWidth((MAX_IMAGE_WIDTH / width))
            }
            else if (height > width && height > MAX_IMAGE_HEIGHT) {
                setImageHeight(MAX_IMAGE_HEIGHT);
                setImageWidth(width * (MAX_IMAGE_HEIGHT / height))
                ratioWidth(MAX_IMAGE_HEIGHT / height)
                ratioHeight((MAX_IMAGE_HEIGHT / height))
            }
            else {
                setImageWidth(width)
                setImageHeight(height)
            }

            // setGetImage(image);

        }
    }, [image]);

    return (<Image image={image} width={imageWidth} height={imageHeight} ref={imageRef} />)
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const DrawAnnotations = () => {
    const [annotations, setAnnotations] = useState([]);
    const [newAnnotation, setNewAnnotation] = useState([]);
    const [imageSrc, setImageSrc] = useState("");
    const [imageWidth, setImageWidth] = useState(0);
    const [imageHeight, setImageHeight] = useState(0);
    const [getImage, setGetImage] = useState([]);
    const [bboxInfo, setBboxInfo] = useState([]);
    const [ratio_w, ratioWidth] = useState(1)
    const [ratio_h, ratioHeight] = useState(1)
    const [base64, setBase64Image] = useState(null)

    const imageRef = useRef();

    // const previewCanvasRef = useRef < HTMLCanvasElement > (null);

    const handleMouseDown = event => {
        if (newAnnotation.length === 0) {
            const { x, y } = event.target.getStage().getPointerPosition();
            setNewAnnotation([{ x, y, width: 0, height: 0, key: "0", label:"" }]);
        }
    };

    const handleMouseUp = event => {
        if (newAnnotation.length === 1) {
            const sx = newAnnotation[0].x;
            const sy = newAnnotation[0].y;
            const { x, y } = event.target.getStage().getPointerPosition();

            const annotationToAdd = {
                x: sx,
                y: sy,
                width: x - sx,
                height: y - sy,
                key: annotations.length + 1,
                label: '' // label rỗng
            };
            setNewAnnotation([]);

            // annotations.push(annotationToAdd);
            // setAnnotations([...annotations]); 
            

            setAnnotations(prevAnnotations => [...prevAnnotations, annotationToAdd]);

            // Gọi hàm cropImage và cập nhật label của annotation sau khi hoàn thành
            cropImage(imageRef, sx, sy ,x-sx, y -sy).then(label => {
                setAnnotations(prevAnnotations =>
                    prevAnnotations.map(annotation =>
                        annotation.key === annotationToAdd.key
                            ? { ...annotation, label: label } // Cập nhật label của annotation
                            : annotation // Giữ nguyên annotation
                    )
                );
            });
            

            
        }

    };



    const handleMouseMove = event => {
        if (newAnnotation.length === 1) {
            const sx = newAnnotation[0].x;
            const sy = newAnnotation[0].y;
            const { x, y } = event.target.getStage().getPointerPosition();
            setNewAnnotation([
                {
                    x: sx,
                    y: sy,
                    width: x - sx,
                    height: y - sy,
                    key: "0",
                    label: ""
                }
            ]);

        }
    };

    const annotationsToDraw = [...annotations, ...newAnnotation];
    return (
        <div>
            {<ImageUploader setAnnotations={setAnnotations} setNewAnnotation={setNewAnnotation} setImageSrc={setImageSrc} setGetImage={setGetImage} />}
            <Stage
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
                width={imageWidth}
                height={imageHeight}
            >
                <Layer>
                    {/* <div> */}
                    {/* <Group x={0} y={0} width={MAX_IMAGE_WIDTH} height={MAX_IMAGE_HEIGHT} draggable={true}> */}
                    {imageSrc && <LoadImage src={imageSrc} imageWidth={imageWidth} imageHeight={imageHeight} setImageWidth={setImageWidth} setImageHeight={setImageHeight} ratioWidth={ratioWidth} ratioHeight={ratioHeight} imageRef={imageRef} />}
                    {annotationsToDraw.map(value => {
                        return (
                            <Rect
                                x={value.x}
                                y={value.y}
                                width={value.width}
                                height={value.height}
                                fill="transparent"
                                stroke="red"
                            />
                        );
                    })}
                    {annotations.map(value => {
                        return (
                            <Text
                            text={value.label}
                            fontSize={13}
                            fill='green'
                            x={value.x}
                            y={value.y - 10}
          />
                        )
                    })}

                </Layer>
            </Stage>

            <div>
                {/* {bboxInfo[0] ?
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                        <img
                            src={getImage}
                            width={bboxInfo[0].width / ratio_w}
                            height={bboxInfo[0].height / ratio_h}
                            crop={{ x: bboxInfo[0].x / ratio_w, y: bboxInfo[0].y / ratio_h, width: bboxInfo[0].width / ratio_w, height: bboxInfo[0].height / ratio_h }}
                        />
                    </div>
                    : <div>ahihi</div>} */}
            </div>
        </div>

    );
};
export const ImageUploader = ({ setAnnotations, setNewAnnotation, setImageSrc, setGetImage }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    // const [selectedImageName, setSelectedImageName] = useState('');


    const handleImageChange = (event) => {
        const file = event.target.files[0];
        // const name = file.name;

        if (file) {
            setImageSrc(URL.createObjectURL(file))

            setAnnotations([])
            setNewAnnotation([])

            const reader = new FileReader();

            reader.onloadend = () => {
                // setSelectedImage(reader.result);
                setGetImage(reader.result);
                // Konva.Image.fromURL(reader.result, setGetImage, console.error);
                // setSelectedImageName(file.name);
                // imageSrc(reader.result); imageName(name);
                // onImageChange({ src: reader.result, name: file.name });
            };

            reader.readAsDataURL(file);
        }
    };

    // const handleImageUpload = () => {
    //   // Đây là nơi để thực hiện các hành động cần thiết sau khi ảnh đã được tải lên

    // };

    return (
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <h1 style={{ marginRight: '24px' }}> Upload Image</h1>
            <input type="file" accept="image/*" onChange={handleImageChange} />

        </div>
    );
};

function App() {
    return (
        <div>
            <DrawAnnotations />
        </div>
    );
}

const rootElement = document.getElementById("root");
ReactDOM.render(<DrawAnnotations />, rootElement);
